import os
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any

from database import get_db, init_db, FloatMetadata, Profile, Measurement
from pipeline import bootstrap_data
from rag_engine import initialize_metadata_store
from query_engine import process_argo_query

app = FastAPI(
    title="FloatChat API",
    description="Backend API for AI-Powered ARGO Ocean Data Explorer",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Lifespan event handler
@app.on_event("startup")
def on_startup():
    print("Starting FloatChat Backend Server...")
    # Initialize DB tables and run automatic NetCDF generation & ingestion if db is empty
    bootstrap_data()
    # Initialize RAG Metadata Store and TF-IDF/Vector embeddings
    db = next(get_db())
    initialize_metadata_store(db)
    print("FloatChat bootstrapping completed successfully.")

@app.get("/")
def read_root():
    # Serve index.html if the React production build exists
    dist_index = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist/index.html"))
    if os.path.exists(dist_index):
        from fastapi.responses import FileResponse
        return FileResponse(dist_index)
        
    return {
        "status": "online",
        "project": "FloatChat",
        "description": "AI-Powered ARGO Ocean Data Explorer Backend (React build missing)"
    }

@app.post("/api/chat")
def chat_endpoint(payload: Dict[str, str] = Body(...), db: Session = Depends(get_db)):
    """
    Main conversational route. Receives a natural language question, processes it,
    runs safety validation on SQL translation, executes the query, and formats explanations.
    """
    query = payload.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        response = process_argo_query(db, query)
        return response
    except Exception as e:
        print(f"Error processing chat request: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/dashboard/stats")
def dashboard_stats_endpoint(db: Session = Depends(get_db)):
    """
    Returns aggregated metrics and stats for the telemetry dashboard.
    """
    try:
        total_floats = db.query(FloatMetadata).count()
        total_profiles = db.query(Profile).count()
        total_measurements = db.query(Measurement).count()
        
        # Calculate min/max/avg for temperature, salinity, oxygen
        # Filter for non-null values
        temp_stats = db.execute(text("SELECT MIN(temperature), MAX(temperature), AVG(temperature) FROM measurements WHERE temperature IS NOT NULL")).fetchone()
        sal_stats = db.execute(text("SELECT MIN(salinity), MAX(salinity), AVG(salinity) FROM measurements WHERE salinity IS NOT NULL")).fetchone()
        oxy_stats = db.execute(text("SELECT MIN(oxygen), MAX(oxygen), AVG(oxygen) FROM measurements WHERE oxygen IS NOT NULL")).fetchone()

        # Recent 10 profiles with floats
        recent_query = """
            SELECT p.profile_id, p.float_id, p.latitude, p.longitude, p.timestamp, 
                   COUNT(m.measurement_id) as levels_count,
                   AVG(m.temperature) as avg_temp
            FROM profiles p
            LEFT JOIN measurements m ON p.profile_id = m.profile_id
            GROUP BY p.profile_id
            ORDER BY p.timestamp DESC
            LIMIT 10;
        """
        recent_res = db.execute(text(recent_query)).fetchall()
        recent_obs = []
        for r in recent_res:
            recent_obs.append({
                "profile_id": r[0],
                "float_id": r[1],
                "latitude": round(r[2], 3),
                "longitude": round(r[3], 3),
                "timestamp": r[4].isoformat() if hasattr(r[4], "isoformat") else (str(r[4]) if r[4] else ""),
                "levels_count": r[5],
                "avg_temp": round(r[6], 2) if r[6] else None
            })

        return {
            "counts": {
                "floats": total_floats,
                "profiles": total_profiles,
                "measurements": total_measurements
            },
            "parameters": {
                "temperature": {
                    "min": round(temp_stats[0], 1) if temp_stats and temp_stats[0] is not None else 0.0,
                    "max": round(temp_stats[1], 1) if temp_stats and temp_stats[1] is not None else 0.0,
                    "avg": round(temp_stats[2], 1) if temp_stats and temp_stats[2] is not None else 0.0
                },
                "salinity": {
                    "min": round(sal_stats[0], 2) if sal_stats and sal_stats[0] is not None else 0.0,
                    "max": round(sal_stats[1], 2) if sal_stats and sal_stats[1] is not None else 0.0,
                    "avg": round(sal_stats[2], 2) if sal_stats and sal_stats[2] is not None else 0.0
                },
                "oxygen": {
                    "min": round(oxy_stats[0], 1) if oxy_stats and oxy_stats[0] is not None else 0.0,
                    "max": round(oxy_stats[1], 1) if oxy_stats and oxy_stats[1] is not None else 0.0,
                    "avg": round(oxy_stats[2], 1) if oxy_stats and oxy_stats[2] is not None else 0.0
                }
            },
            "recent_observations": recent_obs
        }
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/floats")
def floats_coordinates_endpoint(db: Session = Depends(get_db)):
    """
    Returns latest GPS coordinates for all floats to render on maps.
    """
    try:
        # Get the latest profile for each float_id
        query = """
            SELECT p.float_id, p.profile_id, p.latitude, p.longitude, p.timestamp, p.cycle_number, f.project_name
            FROM profiles p
            JOIN (
                SELECT float_id, MAX(timestamp) as max_time
                FROM profiles
                GROUP BY float_id
            ) latest ON p.float_id = latest.float_id AND p.timestamp = latest.max_time
            JOIN floats f ON p.float_id = f.float_id;
        """
        res = db.execute(text(query)).fetchall()
        floats = []
        for r in res:
            floats.append({
                "float_id": r[0],
                "profile_id": r[1],
                "latitude": r[2],
                "longitude": r[3],
                "timestamp": r[4].isoformat() if hasattr(r[4], "isoformat") else (str(r[4]) if r[4] else ""),
                "cycle_number": r[5],
                "project_name": r[6]
            })
        return floats
    except Exception as e:
        print(f"Error fetching floats coordinate data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- Serving Frontend React Production Build -----------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Path to the frontend build output
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.exists(DIST_DIR):
    print(f"React production build detected at: {DIST_DIR}")
    
    # Mount the assets subdirectory for Vite bundled JS/CSS
    if os.path.exists(ASSETS_DIR):
        app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
        print("Mounted /assets static route.")
    
    # SPA catch-all route: serves files if they exist physically, else returns index.html
    @app.get("/{path_name:path}")
    async def catch_all(path_name: str):
        # Ignore API calls - uvicorn checks API routes first, but if an API call was misspelled, let it fall through
        if path_name.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
            
        file_path = os.path.join(DIST_DIR, path_name)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    print(f"Warning: React production build not found at: {DIST_DIR}")
    print("Please run 'npm run build' inside 'frontend/' to compile the frontend assets.")

if __name__ == "__main__":
    import uvicorn
    # In local testing we will run on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
