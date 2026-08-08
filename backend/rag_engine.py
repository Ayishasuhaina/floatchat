import os
import json
import numpy as np
from sqlalchemy.orm import Session
from database import MetadataStore, SessionLocal
from dotenv import load_dotenv

load_dotenv()

# Predefined metadata documents containing schema, parameters, units, spatial/temporal range
METADATA_DOCUMENTS = [
    {
        "category": "schema",
        "name": "floats_table",
        "content": "Table 'floats' stores metadata about physical ARGO floats. Columns: float_id (Integer, Primary Key, e.g., 5904620), project_name (String, e.g., 'ARGO India'), pi_name (String, e.g., 'National Institute of Oceanography (NIO)'). Use float_id to join with 'profiles'."
    },
    {
        "category": "schema",
        "name": "profiles_table",
        "content": "Table 'profiles' represents individual vertical profile measurements taken at a specific location and time. Columns: profile_id (String, Primary Key, format float_id_cycle_number, e.g., '5904620_0'), float_id (Integer, Foreign Key referencing floats.float_id), latitude (Double, in degrees north, negative for South), longitude (Double, in degrees east), timestamp (DateTime/Timestamp, UTC format YYYY-MM-DD HH:MM:SS), cycle_number (Integer, incremental profiling run index)."
    },
    {
        "category": "schema",
        "name": "measurements_table",
        "content": "Table 'measurements' stores physical ocean observations at specific depths/pressures. Columns: measurement_id (Integer, Primary Key, Autoincrement), profile_id (String, Foreign Key referencing profiles.profile_id), depth (Double, pressure in decibars, approx equal to meters depth), temperature (Double, water temperature in Celsius, valid range: 0.0 to 35.0), salinity (Double, ocean salinity in Practical Salinity Units (psu), valid range: 30.0 to 40.0), oxygen (Double, dissolved oxygen in micromole/kg, valid range: 10.0 to 350.0). Contains QC flags: temp_qc, sal_qc, oxy_qc (1=Good, 2=Probably Good, 3=Probably Bad, 4=Bad). Note: Database only stores clean QC-validated measurements (QC 1 or 2)."
    },
    {
        "category": "parameter",
        "name": "temperature_variable",
        "content": "Temperature (TEMP) is measured in degree Celsius (°C). ARGO floats measure this column in 'measurements.temperature'. Valid temperature readings range from sub-zero deep ocean to around 30°C at surface equatorial waters. Surface water is warmer, and temperature decreases sharply with depth (thermocline)."
    },
    {
        "category": "parameter",
        "name": "salinity_variable",
        "content": "Salinity (PSAL) is measured in Practical Salinity Units (psu). ARGO floats measure this column in 'measurements.salinity'. Ocean salinity generally ranges between 34.0 and 36.5 psu. Arabian Sea and northern Indian Ocean have higher salinity due to evaporation, while equatorial regions are intermediate."
    },
    {
        "category": "parameter",
        "name": "oxygen_variable",
        "content": "Dissolved Oxygen (DOXY) is measured in micromole/kg (µmol/kg). ARGO floats measure this column in 'measurements.oxygen'. Near the surface, oxygen is high due to atmospheric contact and photosynthesis. At intermediate depths (200m - 1000m), an Oxygen Minimum Zone (OMZ) occurs where levels drop significantly, before increasing again in the deep ocean."
    },
    {
        "category": "coverage",
        "name": "geographic_indian_ocean",
        "content": "Geographic coverage: Indian Ocean, Arabian Sea, Bay of Bengal, and Equatorial regions. Indian Ocean coordinates are roughly within Latitude: -40.0 to 25.0 degrees North, Longitude: 30.0 to 110.0 degrees East. India's coastal regions are in latitudes 5.0 to 25.0 degrees North, longitudes 65.0 to 95.0 degrees East."
    },
    {
        "category": "coverage",
        "name": "equator_march_2023",
        "content": "Temporal coverage includes March 2023. Equatorial queries refer to Latitude near 0 (e.g., between -2.0 and 2.0 degrees North). In March 2023, Float 5904621 recorded profiles directly on the equator, capturing thermal stratification, salinity variations, and dissolved oxygen profile."
    }
]

def get_simple_tfidf_embedding(text: str) -> list[float]:
    """
    Generates a simple, lightweight vector representation of a string for SQLite RAG.
    Creates a word-frequency based vector normalized by length.
    Ensures zero external dependency while functioning as a reliable local vector search.
    """
    words = [w.strip(".,;:?!()\"'").lower() for w in text.split()]
    # Keep words longer than 2 characters
    words = [w for w in words if len(w) > 2]
    
    # Vocabulary mapping
    vocab = ["schema", "table", "floats", "profiles", "measurements", "depth", 
             "temperature", "temp", "salinity", "psal", "oxygen", "doxy", "qc",
             "indian", "ocean", "india", "equator", "march", "2023", "units", "latitude", "longitude"]
    
    vec = [0.0] * len(vocab)
    for w in words:
        if w in vocab:
            vec[vocab.index(w)] += 1.0
            
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec

def cosine_similarity(v1, v2):
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_a = sum(a * a for a in v1) ** 0.5
    norm_b = sum(b * b for b in v2) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def initialize_metadata_store(db: Session):
    """
    Checks if metadata is initialized. If not, populates metadata store with embeddings.
    """
    if db.query(MetadataStore).count() > 0:
        print("Metadata store already initialized.")
        return
    
    print("Initializing metadata store for RAG...")
    for doc in METADATA_DOCUMENTS:
        emb = get_simple_tfidf_embedding(doc["content"])
        meta_rec = MetadataStore(
            category=doc["category"],
            name=doc["name"],
            content=doc["content"],
            embedding=json.dumps(emb)
        )
        db.add(meta_rec)
    db.commit()
    print("Metadata store initialized with embeddings successfully.")

def retrieve_relevant_metadata(db: Session, query: str, top_k=3) -> str:
    """
    Retrieves the top_k most relevant metadata documents based on query similarity.
    Works dynamically for both pgvector and SQLite fallback.
    """
    query_emb = get_simple_tfidf_embedding(query)
    
    # Retrieve all metadata records
    records = db.query(MetadataStore).all()
    if not records:
        return ""
    
    # Calculate similarity score
    scored_records = []
    for rec in records:
        if rec.embedding:
            rec_emb = json.loads(rec.embedding)
            score = cosine_similarity(query_emb, rec_emb)
            scored_records.append((score, rec.content))
            
    # Sort by score descending
    scored_records.sort(key=lambda x: x[0], reverse=True)
    
    # Take top k
    selected_docs = [content for score, content in scored_records[:top_k]]
    
    # Always append the core table schemas to ensure Text-to-SQL is always schema-aware
    schema_docs = [
        rec.content for rec in records 
        if rec.category == "schema" and rec.content not in selected_docs
    ]
    
    rag_context = "\n\n".join(selected_docs + schema_docs)
    return rag_context

if __name__ == "__main__":
    db = SessionLocal()
    try:
        initialize_metadata_store(db)
        context = retrieve_relevant_metadata(db, "salinity at equator in march")
        print("\n--- Retrieved RAG Context ---")
        print(context)
    finally:
        db.close()
