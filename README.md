# FloatChat – AI-Powered ARGO Ocean Data Explorer

FloatChat is a full-stack web application that democratizes access to ARGO ocean float data. Users can query data using natural language, which is parsed into safe SQL queries, executed against an indexed database, and returned as interactive Plotly charts, Leaflet maps, and clear plain-language summaries.

---

## 1. Project Overview

ARGO floats gather physical oceanographic measurements (temperature, salinity, oxygen, depth, location, time) globally. This data is critical for monitoring climate change and maritime habitats, but is locked in complex binary NetCDF files. Normally, using this data requires advanced coding (xarray/pandas/Python) and spatial querying skills. 

**FloatChat** removes this complexity. It allows students, researchers, policymakers, and journalists to query ARGO telemetry databases using conversational language.

---

## 2. Core Problem & Solution

*   **Problem:** ARGO telemetry data is high-volume and high-complexity. Standard queries require compiling netCDF files, cleaning sensors data, and writing databases or mapping code.
*   **Solution:** FloatChat automates data ingestion, sanitizes inputs using official Quality-Control (QC) standards, translates questions using schema-aware LLMs + RAG, validates SQL safety, and renders interactive plots and maps.

---

## 3. System Architecture

```
ARGO NetCDF Files
      ↓
NetCDF Ingestion Pipeline (xarray, netCDF4, pandas)
      ↓
Data Cleaning & Quality Control Filter
      ↓
PostgreSQL (+pgvector) / SQLite Database
      ↓
User Question (Natural Language)
      ↓
LLM + RAG Metadata Store (LangChain)
      ↓
Safe Text-to-SQL Conversion
      ↓
SQL Safety Validator (Read-Only SELECT Whitelist)
      ↓
Query Execution & Data Extraction
      ↓
Plotly.js (Charts) / Leaflet.js (Maps) / Data Table Rendering
      ↓
Plain-Language Oceanographic Explanation
      ↓
User Interface
```

---

## 4. Technology Stack

*   **Frontend:** React.js, Vite, Tailwind CSS, Leaflet.js, Plotly.js, Lucide Icons.
*   **Backend:** Python, FastAPI, SQLAlchemy, Uvicorn.
*   **Data Science:** Xarray, NetCDF4, Pandas, NumPy.
*   **AI Orchestration & RAG:** LangChain, OpenAI API / Compatible LLM providers.
*   **Databases:** PostgreSQL with `pgvector` (Production) & SQLite (Local Fallback).

---

## 5. Directory Structure

```
floatchat/
├── backend/
│   ├── main.py              # FastAPI app setup, routes, and bootstrapping
│   ├── database.py          # SQLAlchemy schemas and database connections
│   ├── pipeline.py          # NetCDF ingestion and ARGO QC filters
│   ├── data_generator.py    # Auto-generates mock NetCDF files for demo mode
│   ├── validator.py         # Regular expression-based SQL safety validator
│   ├── rag_engine.py        # Vector embedding store and schema context retriever
│   ├── query_engine.py      # SQL generator, LangChain parser, and demo intent router
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LeafletMap.jsx    # Custom dark-theme map drawing tool
│   │   │   └── PlotlyChart.jsx   # Custom lazy-loaded responsive charting tool
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Welcome, features, and target user summaries
│   │   │   ├── Chat.jsx          # AI Explorer conversational interface
│   │   │   ├── Dashboard.jsx     # Telemetry charts and global markers grid
│   │   │   └── InfoPages.jsx     # Judges presentation: architecture, feasibility, SDGs, refs
│   │   ├── App.jsx               # Layout scaffolding and router
│   │   ├── index.css             # Glassmorphism, animations, and custom scrollbars
│   │   └── main.jsx              # React mounting file
│   ├── index.html                # Imports Leaflet and Plotly CDN links
│   ├── package.json              # Node packages configuration
│   ├── vite.config.js            # Port proxy setup
│   ├── tailwind.config.js        # Styles template configs
│   └── postcss.config.js         # PostCSS config
├── docker/
│   ├── docker-compose.yml        # Multi-container orchestration config
│   ├── Dockerfile.backend        # FastAPI container file
│   └── Dockerfile.frontend       # Vite React container file
├── data/                         # Data ingestion storage directory
├── .env.example                  # Environment configuration templates
└── README.md                     # Comprehensive setup and user guide
```

---

## 6. Setup & Running Instructions

### Unified Single-Host Mode (Recommended for Final Demo)

In this mode, FastAPI serves the React production build directly on a single port (`8000`).

#### A. Automated One-Command Startup (Windows)
If you are on Windows, simply double-click the `start.bat` file in the root folder or execute it from the terminal:
```bash
.\start.bat
```
This script will automatically install npm dependencies, compile the React production bundle (`frontend/dist/`), install python packages, and start FastAPI.

#### B. Manual In-Order Build & Startup
If running on Linux/macOS or building manually:
1. Navigate to the frontend folder, install dependencies, and build the production bundle:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. Navigate to the backend folder, install dependencies, and start FastAPI:
   ```bash
   cd ../backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
3. Open your browser and access the unified application at:
   ```text
   http://localhost:8000
   ```

---

### Separate Development Mode (Optional)

If you would like to edit code with hot reloading enabled:

#### A. Start Backend Server
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
This runs the API server on `http://localhost:8000`.

#### B. Start Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
This runs the React dev server on `http://localhost:5173`, proxying `/api/*` endpoints to the backend port.

---

### Docker Multi-Container Deployment (PostgreSQL + pgvector Production Setup)

This spins up three containers: PostgreSQL (with pgvector), FastAPI backend, and Vite React frontend dev server.

1. Create a `.env` file in the root directory and copy the contents from `.env.example`.
2. Configure your OpenAI credentials inside `.env` if you want to use the live AI model (otherwise, the system will use Demo Mode).
3. Build and launch the containers:
   ```bash
   docker-compose -f docker/docker-compose.yml up --build
   ```
4. Access the frontend app at `http://localhost:5173` and the backend at `http://localhost:8000`.

---
---

## 7. Operational Modes

### A. Demo Mode (Zero API Key Needed)
If `OPENAI_API_KEY` is not present in `.env`, FloatChat automatically boots in **Demo Mode**. 
*   Uses a local regex/TF-IDF intent matcher to identify standard questions.
*   Translates questions into the corresponding SQL queries.
*   Runs the SQL queries against the local SQLite database to retrieve real dynamic data.
*   Compiles Plotly and Leaflet configs based on actual query data.
*   Applies data results to templated explanations (calculating exact averages, ranges, and drift coordinates) to ensure the outputs are fully dynamic.

**Predefined Example Queries:**
1. *"Show temperature near India."* (Plots Bay of Bengal / Arabian Sea coordinates on the map and vertical depth profiles).
2. *"Show salinity near the equator in March 2023."* (Queries March equatorial profiles, rendering salinity vs depth curves).
3. *"Show temperature changes over time."* (Computes average surface sea temperature over time, plotting a line graph).
4. *"Show temperature versus depth."* (Aggregates measurements by vertical depth level, drawing a composite temperature profile).
5. *"Show oxygen levels over time."* (Plots surface dissolved oxygen concentrations over time).
6. *"Show ARGO float locations in the Indian Ocean."* (Plots active telemetry drift coordinates of all floats on the map).

### B. Production Mode (Live AI SQL Compiler)
By adding a valid `OPENAI_API_KEY` inside `.env`, the system unlocks full AI functionality.
*   Retrieves schema and variable context from the metadata vector store (RAG).
*   Translates any custom question (e.g. *"Show temperature deeper than 500 meters at latitude 12"*) into a safe SQL query using LangChain.
*   Runs validation against SQL injection and rejects updates/deletes.
*   Queries the live database.
*   Feeds retrieved data back to the LLM to write a plain-language explanation of the scientific observations.

---

## 8. Safety & Validation Guardrails

To prevent SQL Injection or server database tampering, every generated SQL query is passed through `validator.py` before execution:
1.  **Read-Only SELECT Whitelist:** Queries MUST start with `SELECT` or `WITH`.
2.  **Forbidden Keywords:** Rejects commands matching `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `REPLACE`, `UNION`, `INTO`.
3.  **Strict Table Access:** Queries can only access `floats`, `profiles`, `measurements`, or `metadata_store`. Access to catalog system tables (e.g. `sqlite_master` or `pg_` catalogs) is immediately blocked.

---

## 9. Future Scope

*   **Extended Variable Ingest:** Incorporate bio-geochemical ARGO profiles (chlorophyll, nitrate, pH, turbidity).
*   **Spatial Indexing Optimization:** Transition SQLite geometries to PostGIS coordinates for large-scale spatial queries.
*   **Predictive AI Models:** Overlay AI forecasting models to predict marine heatwave occurrences and dissolved oxygen dead zone migrations.
