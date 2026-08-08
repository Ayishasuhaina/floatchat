import os
import json
import numpy as np
from sqlalchemy import create_engine, Column, Integer, Double, String, ForeignKey, DateTime, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv

load_dotenv()

# Detect database provider
# Default to SQLite local database file
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./floatchat.db")
IS_SQLITE = DATABASE_URL.startswith("sqlite")

# Create engine
if IS_SQLITE:
    # SQLite requires check_same_thread=False for multi-threaded uvicorn environments
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ----------------- Database Schemas -----------------

class FloatMetadata(Base):
    __tablename__ = "floats"
    
    float_id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String, default="ARGO India")
    pi_name = Column(String, default="National Institute of Oceanography (NIO)")
    
    profiles = relationship("Profile", back_populates="float_meta", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"
    
    profile_id = Column(String, primary_key=True, index=True) # e.g. "5904620_1"
    float_id = Column(Integer, ForeignKey("floats.float_id", ondelete="CASCADE"), index=True)
    latitude = Column(Double, nullable=False)
    longitude = Column(Double, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    cycle_number = Column(Integer, nullable=False)
    
    float_meta = relationship("FloatMetadata", back_populates="profiles")
    measurements = relationship("Measurement", back_populates="profile", cascade="all, delete-orphan")


class Measurement(Base):
    __tablename__ = "measurements"
    
    measurement_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    profile_id = Column(String, ForeignKey("profiles.profile_id", ondelete="CASCADE"), index=True)
    depth = Column(Double, nullable=False)  # Pressure in decibars (~depth in meters)
    temperature = Column(Double, nullable=True)
    salinity = Column(Double, nullable=True)
    oxygen = Column(Double, nullable=True)
    
    # QC Flag variables (1 = Good, 2 = Probably Good, 3 = Probably Bad, 4 = Bad)
    temp_qc = Column(Integer, default=1)
    sal_qc = Column(Integer, default=1)
    oxy_qc = Column(Integer, default=1)
    
    profile = relationship("Profile", back_populates="measurements")


class MetadataStore(Base):
    __tablename__ = "metadata_store"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String, index=True) # e.g. "variable", "schema", "coverage"
    name = Column(String, index=True) # e.g. "TEMP", "SALINITY"
    content = Column(Text, nullable=False) # JSON or Text describing variable
    embedding = Column(Text, nullable=True) # Store embeddings as string/JSON array for SQLite fallback

# ----------------- Indexes -----------------
# Create spatial, temporal, depth indexes for SQLite or Postgres
# Note: For SQLite, indexes are created standardly. For Postgres, we can do the same.
# We index columns that will be queried in Text-to-SQL (lat/lon, timestamp, depth, parameter qc, etc.)
Index("idx_profiles_coords", Profile.latitude, Profile.longitude)
Index("idx_profiles_timestamp", Profile.timestamp)
Index("idx_measurements_qc", Measurement.temp_qc, Measurement.sal_qc, Measurement.oxy_qc)
Index("idx_measurements_depth", Measurement.depth)

# Create tables
def init_db():
    # If postgres, make sure pgvector is enabled if the user wants it
    if not IS_SQLITE:
        try:
            with engine.connect() as conn:
                conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                conn.commit()
            print("PostgreSQL pgvector extension verified.")
        except Exception as e:
            print(f"Note: Could not load pgvector extension ({e}). Storing embeddings as TEXT.")
            
    Base.metadata.create_all(bind=engine)
    print("Database tables and indexes verified successfully.")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
