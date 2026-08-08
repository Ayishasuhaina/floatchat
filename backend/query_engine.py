import os
import json
import re
import numpy as np
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from validator import validate_sql_query
from rag_engine import retrieve_relevant_metadata
from dotenv import load_dotenv

load_dotenv()

# Check for LLM configurations
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "gpt-4o-mini")

# Attempt LangChain imports
try:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

def query_llm_for_sql(user_query: str, schema_context: str) -> str:
    """
    Sends the user query and RAG schema context to the LLM to get a raw SQL statement.
    """
    system_prompt = f"""You are a specialized Text-to-SQL assistant for FloatChat (an ARGO ocean float database explorer).
Given the database schema metadata and units below, translate the user's natural language question into a single safe, read-only SQL SELECT query.

DATABASE METADATA & SCHEMA CONTEXT:
{schema_context}

RULES:
1. ONLY return the raw SQL query. Do NOT wrap it in markdown code blocks, backticks, or write explanations.
2. Only write read-only SELECT queries referencing the floats, profiles, or measurements tables.
3. Apply correct WHERE clauses for bounding boxes, parameters, or timestamps based on metadata context.
4. Ensure you perform correct JOINs: profiles joins floats on float_id, measurements joins profiles on profile_id.
5. In PostgreSQL, timestamp fields are TIMESTAMPS. In SQLite, they can be searched using text date comparisons (e.g. timestamp >= '2023-03-01'). Use ISO strings for dates.
6. Only return variables that exist in the schema.
7. Limit results to a maximum of 300 records to prevent overloading the visualization.

Example output:
SELECT p.latitude, p.longitude, m.temperature FROM profiles p JOIN measurements m ON p.profile_id = m.profile_id WHERE p.latitude BETWEEN -2 AND 2 LIMIT 100
"""

    if HAS_LANGCHAIN and OPENAI_API_KEY:
        try:
            llm = ChatOpenAI(
                model=LLM_MODEL_NAME,
                openai_api_key=OPENAI_API_KEY,
                openai_api_base=OPENAI_API_BASE,
                temperature=0.0
            )
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("user", "{query}")
            ])
            chain = prompt | llm
            response = chain.invoke({"query": user_query})
            return response.content.strip()
        except Exception as e:
            print(f"LangChain LLM Query failed: {e}. Falling back to direct OpenAI API.")

    # Fallback to direct OpenAI client call if LangChain fails or is unavailable
    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_API_BASE)
            response = client.chat.completions.create(
                model=LLM_MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ],
                temperature=0.0
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Direct OpenAI client query failed: {e}")
            
    return ""

def query_llm_for_explanation(user_query: str, data_summary: str) -> str:
    """
    Asks the LLM to write a plain-language explanation of the retrieved data.
    """
    system_prompt = """You are FloatChat's oceanography expert assistant.
Provide a clear, brief, plain-language explanation of the retrieved ARGO float data in response to the user's question.
Explain any physical oceanographic processes or observations (like temperature drop with depth, salinity maximums, or oxygen depletion in the Oxygen Minimum Zone) if they are visible in the data.
Keep your explanation to 3-5 sentences. Frame the explanation for a student, researcher, or policymaker.
"""
    user_prompt = f"Question: {user_query}\n\nRetrieved Data Summary:\n{data_summary}\n\nWrite a short, engaging oceanographic summary:"

    if HAS_LANGCHAIN and OPENAI_API_KEY:
        try:
            llm = ChatOpenAI(
                model=LLM_MODEL_NAME,
                openai_api_key=OPENAI_API_KEY,
                openai_api_base=OPENAI_API_BASE,
                temperature=0.7
            )
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("user", "{prompt_text}")
            ])
            chain = prompt | llm
            response = chain.invoke({"prompt_text": user_prompt})
            return response.content.strip()
        except Exception as e:
            print(f"LangChain explanation query failed: {e}")

    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_API_BASE)
            response = client.chat.completions.create(
                model=LLM_MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Direct OpenAI explanation failed: {e}")

    return ""

# ----------------- Demo Mode Matcher -----------------

DEMO_QUERIES = [
    {
        "id": 1,
        "keywords": ["temperature", "india", "coastal", "bay of bengal", "arabian sea"],
        "sql": """SELECT p.profile_id, p.float_id, p.latitude, p.longitude, p.timestamp, m.depth, m.temperature, m.salinity
FROM profiles p
JOIN measurements m ON p.profile_id = m.profile_id
WHERE p.latitude BETWEEN 5.0 AND 22.0 AND p.longitude BETWEEN 65.0 AND 90.0
ORDER BY p.timestamp DESC, m.depth ASC
LIMIT 120;""",
        "viz_type": "depth",
        "explanation_template": "In the Indian Ocean near the subcontinent (Lat: {lat_range}, Lon: {lon_range}), surface temperatures are warm, peaking around {max_val}°C, representative of the tropical warm pool. As depth increases, the temperature decreases down to {min_val}°C at {max_depth} meters depth. This transition shows a well-defined mixed layer depth of about 40 meters, below which the thermocline begins. Oceanographers use this thermal structure to predict monsoon strength and cyclone heat potential."
    },
    {
        "id": 2,
        "keywords": ["salinity", "equator", "march", "2023"],
        "sql": """SELECT p.profile_id, p.float_id, p.latitude, p.longitude, p.timestamp, m.depth, m.salinity, m.temperature
FROM profiles p
JOIN measurements m ON p.profile_id = m.profile_id
WHERE p.latitude BETWEEN -2.0 AND 2.0 
  AND p.timestamp >= '2023-03-01 00:00:00' 
  AND p.timestamp <= '2023-03-31 23:59:59'
ORDER BY p.timestamp DESC, m.depth ASC
LIMIT 150;""",
        "viz_type": "depth",
        "explanation_template": "These equatorial salinity profiles from March 2023 reveal distinct hydrological features. The surface salinity averages {avg_val} psu, which is slightly lower due to equatorial precipitation. At about 100 meters, we observe a salinity maximum of {max_val} psu, which corresponds to the subsurface penetration of high-salinity water masses drifting from the Arabian Sea. This salinity stratification plays a key role in stabilizing the upper ocean layers."
    },
    {
        "id": 3,
        "keywords": ["temperature", "changes", "time", "trend", "season"],
        "sql": """SELECT p.timestamp, AVG(m.temperature) as avg_temperature
FROM profiles p
JOIN measurements m ON p.profile_id = m.profile_id
WHERE m.depth <= 10.0
GROUP BY p.timestamp
ORDER BY p.timestamp ASC;""",
        "viz_type": "time-series",
        "explanation_template": "This time-series displays the variation of sea surface temperature (SST) between {start_date} and {end_date}. The temperature ranges from {min_val}°C to {max_val}°C, showing gradual warming as spring progresses. This surface heating is driven by increased solar radiation and lighter wind speeds. Monitoring these SST trends is essential for tracing regional ocean currents and modeling maritime weather conditions."
    },
    {
        "id": 4,
        "keywords": ["temperature", "depth", "versus", "profile"],
        "sql": """SELECT m.depth, AVG(m.temperature) as avg_temperature
FROM measurements m
GROUP BY m.depth
ORDER BY m.depth ASC;""",
        "viz_type": "depth",
        "explanation_template": "This composite depth profile shows the average temperature structure across the entire region. The ocean mixed layer extends to about 50m with a uniform temperature of {max_val}°C. Below this layer, the thermocline displays a rapid drop in temperature, reaching {min_val}°C at {max_depth} meters. Below 1000 meters, the water temperature stabilizes as it nears the deep ocean abyss."
    },
    {
        "id": 5,
        "keywords": ["oxygen", "time", "levels", "doxy"],
        "sql": """SELECT p.timestamp, AVG(m.oxygen) as avg_oxygen
FROM profiles p
JOIN measurements m ON p.profile_id = m.profile_id
WHERE m.depth <= 10.0
GROUP BY p.timestamp
ORDER BY p.timestamp ASC;""",
        "viz_type": "time-series",
        "explanation_template": "Surface dissolved oxygen levels over time show a steady concentration between {min_val} and {max_val} µmol/kg. This high surface oxygen is maintained by continuous atmospheric exchange and photosynthetic production by phytoplankton. These levels support diverse biological productivity in the upper ocean photic zone."
    },
    {
        "id": 6,
        "keywords": ["location", "float", "indian ocean", "positions", "map"],
        "sql": """SELECT p.float_id, p.profile_id, p.latitude, p.longitude, p.timestamp
FROM profiles p
ORDER BY p.timestamp DESC
LIMIT 60;""",
        "viz_type": "map",
        "explanation_template": "The map displays the coordinates of active ARGO float profiles in the Indian Ocean. A total of {count} profile points are mapped, indicating drift trajectories. Float 5904620 drifts northeastward in the Bay of Bengal, Float 5904621 moves along the equator, and Float 5904622 surveys the Arabian Sea. These trajectories help oceanographers track deep ocean circulation currents."
    }
]

def parse_query_demo(query: str) -> dict:
    """
    Determines if query matches any of the demo templates.
    Returns the metadata template if matched.
    """
    normalized = query.lower()
    
    # Check for general/ambiguous question
    ambiguous_triggers = ["how is the ocean doing", "ocean health", "how is the sea", "what is the state of the ocean", "ocean status"]
    for trigger in ambiguous_triggers:
        if trigger in normalized:
            return {
                "ambiguous": True,
                "response": "Could you specify what you would like to explore: temperature, salinity, oxygen, or another parameter?"
            }
            
    # Check for simple empty or extremely short query
    if len(normalized.strip()) < 4:
        return {
            "error": True,
            "response": "Could you specify what you would like to explore: temperature, salinity, oxygen, or another parameter?"
        }

    # Match based on keyword overlaps
    best_match = None
    max_overlap = 0
    
    for dq in DEMO_QUERIES:
        overlap = sum(1 for kw in dq["keywords"] if kw in normalized)
        if overlap > max_overlap:
            max_overlap = overlap
            best_match = dq
            
    # Return match if we have at least 2 keywords, or if we have a direct match
    if max_overlap >= 1:
        return best_match
        
    return None

# ----------------- Main Query Routing Engine -----------------

def process_argo_query(db: Session, user_query: str) -> dict:
    """
    Main entry point for natural language questions.
    Performs RAG metadata retrieval, SQL generation, validation, execution, and explanation.
    """
    print(f"\nProcessing user query: '{user_query}'")
    
    # 1. Retrieve RAG metadata context
    metadata_context = retrieve_relevant_metadata(db, user_query)
    
    # Check if we should run in LLM mode or Demo Mode
    is_demo_mode = (not OPENAI_API_KEY)
    matched_demo = parse_query_demo(user_query)
    
    # Handle direct ambiguous responses
    if matched_demo and "ambiguous" in matched_demo:
        return {
            "query": user_query,
            "sql": "",
            "is_safe": True,
            "data": [],
            "visualization": "text",
            "explanation": matched_demo["response"],
            "error": None,
            "mode": "clarification"
        }

    sql_query = ""
    viz_type = "table"
    explanation = ""

    # If API key is present and no clear demo match (or if we want to run LLM), use LLM
    if not is_demo_mode:
        print("Executing in LLM + RAG Production Mode.")
        sql_query = query_llm_for_sql(user_query, metadata_context)
        # Determine viz type heuristically from question
        q_lower = user_query.lower()
        if "map" in q_lower or "location" in q_lower or "position" in q_lower:
            viz_type = "map"
        elif "depth" in q_lower or "versus depth" in q_lower or "vertical" in q_lower:
            viz_type = "depth"
        elif "over time" in q_lower or "time series" in q_lower or "trend" in q_lower or "changes" in q_lower:
            viz_type = "time-series"
        else:
            viz_type = "table"
    else:
        print("Executing in Local Dynamic Demo Mode.")
        if matched_demo:
            sql_query = matched_demo["sql"]
            viz_type = matched_demo["viz_type"]
        else:
            # If no API key and no matched demo query, return a helpful clarification instead of crashing
            return {
                "query": user_query,
                "sql": "",
                "is_safe": True,
                "data": [],
                "visualization": "text",
                "explanation": "FloatChat is currently running in local Demo Mode. Please ask one of our standard queries (e.g., 'Show temperature near India' or 'Show salinity near the equator in March 2023'), or configure an OPENAI_API_KEY in the backend to ask custom natural language questions.",
                "error": None,
                "mode": "demo_fallback"
            }

    # 2. SQL Safety Validation
    is_safe, error_msg = validate_sql_query(sql_query)
    if not is_safe:
        print(f"SQL Validation failed: {error_msg}")
        return {
            "query": user_query,
            "sql": sql_query,
            "is_safe": False,
            "data": [],
            "visualization": "text",
            "explanation": "Query validation error: The generated SQL was rejected by the SQL Safety Validator.",
            "error": error_msg,
            "mode": "error"
        }

    # 3. Execute Query & Retrieve Data
    print(f"Executing SQL: {sql_query}")
    try:
        result = db.execute(text(sql_query))
        columns = list(result.keys())
        rows = result.fetchall()
        
        # Convert to list of dicts for JSON transmission
        data = [dict(zip(columns, row)) for row in rows]
        print(f"Successfully retrieved {len(data)} observations.")
    except Exception as e:
        print(f"Database execution error: {e}")
        return {
            "query": user_query,
            "sql": sql_query,
            "is_safe": True,
            "data": [],
            "visualization": "text",
            "explanation": "Database execution error: Failed to query the tables.",
            "error": str(e),
            "mode": "error"
        }

    # 4. Generate Plain-Language Explanation
    if not data:
        explanation = "No matching observations found in the database. Ensure that the ingestion pipeline has parsed files matching your geographic/temporal constraints."
    elif not is_demo_mode:
        # LLM Summary
        # Summarize data statistics for LLM context
        df = pd.DataFrame(data)
        summary_stats = df.describe().to_string()
        data_summary = f"Columns: {columns}\nNumber of rows: {len(df)}\nStatistics:\n{summary_stats}"
        explanation = query_llm_for_explanation(user_query, data_summary)
    else:
        # Dynamic Demo Template Filling
        try:
            df = pd.DataFrame(data)
            
            if matched_demo["id"] == 1: # India Temp
                lat_min, lat_max = df['latitude'].min(), df['latitude'].max()
                lon_min, lon_max = df['longitude'].min(), df['longitude'].max()
                max_t = round(df['temperature'].max(), 1)
                min_t = round(df['temperature'].min(), 1)
                max_d = int(df['depth'].max())
                
                explanation = matched_demo["explanation_template"].format(
                    lat_range=f"{lat_min:.1f}°N to {lat_max:.1f}°N",
                    lon_range=f"{lon_min:.1f}°E to {lon_max:.1f}°E",
                    max_val=max_t,
                    min_val=min_t,
                    max_depth=max_d
                )
            elif matched_demo["id"] == 2: # Equator Salinity
                avg_s = round(df['salinity'].mean(), 2)
                max_s = round(df['salinity'].max(), 2)
                explanation = matched_demo["explanation_template"].format(
                    avg_val=avg_s,
                    max_val=max_s
                )
            elif matched_demo["id"] == 3: # Temp changes
                # Date conversion
                # Convert timestamps to nice strings
                timestamps = pd.to_datetime(df['timestamp'])
                start_date = timestamps.min().strftime('%B %d, %Y')
                end_date = timestamps.max().strftime('%B %d, %Y')
                min_t = round(df['avg_temperature'].min(), 1)
                max_t = round(df['avg_temperature'].max(), 1)
                explanation = matched_demo["explanation_template"].format(
                    start_date=start_date,
                    end_date=end_date,
                    min_val=min_t,
                    max_val=max_t
                )
            elif matched_demo["id"] == 4: # Temp vs depth
                max_t = round(df['avg_temperature'].max(), 1)
                min_t = round(df['avg_temperature'].min(), 1)
                max_d = int(df['depth'].max())
                explanation = matched_demo["explanation_template"].format(
                    max_val=max_t,
                    min_val=min_t,
                    max_depth=max_d
                )
            elif matched_demo["id"] == 5: # Oxygen levels
                min_o = round(df['avg_oxygen'].min(), 1)
                max_o = round(df['avg_oxygen'].max(), 1)
                explanation = matched_demo["explanation_template"].format(
                    min_val=min_o,
                    max_val=max_o
                )
            elif matched_demo["id"] == 6: # Float locations
                count = len(df['float_id'].unique()) if 'float_id' in df else len(df)
                explanation = matched_demo["explanation_template"].format(
                    count=count
                )
        except Exception as e:
            print(f"Error compiling demo explanation: {e}")
            explanation = "Successfully queried and retrieved ARGO float telemetry data. Showing observations on map/chart."

    return {
        "query": user_query,
        "sql": sql_query,
        "is_safe": True,
        "data": data,
        "visualization": viz_type,
        "explanation": explanation,
        "error": None,
        "mode": "production" if not is_demo_mode else "demo"
    }
