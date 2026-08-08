import os
import glob
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import xarray as xr
from sqlalchemy.orm import Session
from database import FloatMetadata, Profile, Measurement, engine, SessionLocal, init_db
from data_generator import generate_mock_netcdf

def clean_qc_val(val):
    """
    ARGO QC flags are sometimes byte arrays, character arrays, or integers.
    Converts flag to integer.
    1 = Good, 2 = Probably Good, 3 = Probably Bad, 4 = Bad, 0 = No QC performed
    """
    if val is None or pd.isna(val):
        return 0
    try:
        # If byte or string
        if isinstance(val, (bytes, str)):
            val_str = val.decode('utf-8') if isinstance(val, bytes) else val
            val_str = val_str.strip()
            if not val_str:
                return 0
            return int(val_str)
        return int(val)
    except Exception:
        return 0

def ingest_netcdf_files(db: Session, data_dir="data"):
    """
    Scans the data directory for NetCDF files, parses them, applies ARGO QC filters,
    and inserts clean, structured data into the database.
    """
    # Auto-generate mock data if no netcdf files exist in data_dir
    nc_files = glob.glob(os.path.join(data_dir, "*.nc"))
    if not nc_files:
        print("No NetCDF files found. Generating sample data first...")
        generate_mock_netcdf(data_dir)
        nc_files = glob.glob(os.path.join(data_dir, "*.nc"))
        if not nc_files:
            print("Failed to find or generate NetCDF files.")
            return

    print(f"Found {len(nc_files)} NetCDF file(s) for ingestion.")

    for file_path in nc_files:
        print(f"Processing file: {file_path}")
        try:
            # Load with xarray
            ds = xr.open_dataset(file_path)
            
            # Dimensions
            n_prof = ds.dims.get('N_PROF', 0)
            n_levels = ds.dims.get('N_LEVELS', 0)
            
            print(f"File contains {n_prof} profiles with {n_levels} vertical depth levels each.")

            # Load variables into memory/arrays
            # Platform number is character array [N_PROF, STRING8] or string
            plat_num_var = ds['PLATFORM_NUMBER'].values
            
            # Convert platform numbers to clean strings/integers
            float_ids = []
            for p in range(n_prof):
                row = plat_num_var[p]
                if isinstance(row, np.ndarray) or isinstance(row, bytes) or isinstance(row, list):
                    # decode character array
                    float_str = "".join([c.decode('utf-8') if isinstance(c, bytes) else str(c) for c in row]).strip()
                else:
                    float_str = str(row).strip()
                float_ids.append(int(float_str))

            lats = ds['LATITUDE'].values
            lons = ds['LONGITUDE'].values
            juld = ds['JULD'].values
            
            # Measurement profiles
            pres = ds['PRES'].values
            temp = ds['TEMP'].values
            psal = ds['PSAL'].values
            
            # Oxygen is optional in standard ARGO but required for FloatChat
            doxy = ds['DOXY'].values if 'DOXY' in ds else np.full((n_prof, n_levels), np.nan)

            # QC flags
            temp_qc = ds['TEMP_QC'].values if 'TEMP_QC' in ds else np.ones((n_prof, n_levels))
            psal_qc = ds['PSAL_QC'].values if 'PSAL_QC' in ds else np.ones((n_prof, n_levels))
            doxy_qc = ds['DOXY_QC'].values if 'DOXY_QC' in ds else np.ones((n_prof, n_levels))

            julian_base = datetime(1950, 1, 1)

            # Insert FloatMetadata and Profiles
            for p in range(n_prof):
                float_id = float_ids[p]
                
                # Check if float exists, if not create
                float_meta = db.query(FloatMetadata).filter_by(float_id=float_id).first()
                if not float_meta:
                    float_meta = FloatMetadata(
                        float_id=float_id,
                        project_name="ARGO Indian Ocean Ingestion" if float_id != 5904621 else "ARGO Equatorial Dynamic Ingestion",
                        pi_name="FloatChat SIH Processor"
                    )
                    db.add(float_meta)
                    db.commit()

                # Process JULD to datetime
                juld_val = juld[p]
                if pd.isna(juld_val):
                    print(f"Skipping profile {p} due to missing JULD timestamp.")
                    continue
                
                # Convert JULD dynamically (handles float offsets and auto-decoded datetime64)
                if isinstance(juld_val, (np.datetime64, datetime)):
                    if isinstance(juld_val, np.datetime64):
                        profile_date = pd.to_datetime(juld_val).to_pydatetime()
                    else:
                        profile_date = juld_val
                else:
                    try:
                        juld_float = float(juld_val)
                        if np.isnan(juld_float) or np.isinf(juld_float) or juld_float < 0 or juld_float > 1000000:
                            print(f"Skipping profile {p} due to invalid JULD bounds: {juld_float}")
                            continue
                        profile_date = julian_base + timedelta(days=juld_float)
                    except Exception as e:
                        print(f"Skipping profile {p} due to date conversion error: {e}")
                        continue
                
                # Process Coordinates
                lat_val = float(lats[p])
                lon_val = float(lons[p])
                if np.isnan(lat_val) or np.isnan(lon_val):
                    print(f"Skipping profile {p} due to missing/invalid GPS coordinates.")
                    continue

                # Create profile identifier
                profile_id = f"{float_id}_{p}"
                
                # Check if profile already exists
                profile_rec = db.query(Profile).filter_by(profile_id=profile_id).first()
                if profile_rec:
                    # Remove old one for clean overwrite
                    db.delete(profile_rec)
                    db.commit()
                
                profile_rec = Profile(
                    profile_id=profile_id,
                    float_id=float_id,
                    latitude=lat_val,
                    longitude=lon_val,
                    timestamp=profile_date,
                    cycle_number=p
                )
                db.add(profile_rec)
                
                # Ingest individual depth levels applying strict QC Filters
                # ONLY observations with QC = 1 (Good) or 2 (Probably Good) are accepted.
                # If a variable's QC is bad (3 or 4), we set the value to NULL (None).
                # If all variables are NULL or depth is missing, we skip.
                measurements_to_add = []
                for lv in range(n_levels):
                    depth_val = float(pres[p, lv])
                    if np.isnan(depth_val):
                        continue
                    
                    t_val = float(temp[p, lv])
                    s_val = float(psal[p, lv])
                    o_val = float(doxy[p, lv])
                    
                    t_qc_val = clean_qc_val(temp_qc[p, lv] if len(temp_qc.shape) > 1 else temp_qc[lv])
                    s_qc_val = clean_qc_val(psal_qc[p, lv] if len(psal_qc.shape) > 1 else psal_qc[lv])
                    o_qc_val = clean_qc_val(doxy_qc[p, lv] if len(doxy_qc.shape) > 1 else doxy_qc[lv])

                    # Clean temperature
                    if t_qc_val not in [1, 2] or np.isnan(t_val) or t_val < -5.0 or t_val > 40.0:
                        t_val = None
                    
                    # Clean salinity
                    if s_qc_val not in [1, 2] or np.isnan(s_val) or s_val < 0.0 or s_val > 45.0:
                        s_val = None

                    # Clean oxygen
                    if o_qc_val not in [1, 2] or np.isnan(o_val) or o_val < 0.0 or o_val > 1000.0:
                        o_val = None

                    # If all variables are filtered out, don't save this measurement layer
                    if t_val is None and s_val is None and o_val is None:
                        continue

                    meas = Measurement(
                        profile_id=profile_id,
                        depth=depth_val,
                        temperature=t_val,
                        salinity=s_val,
                        oxygen=o_val,
                        temp_qc=t_qc_val,
                        sal_qc=s_qc_val,
                        oxy_qc=o_qc_val
                    )
                    measurements_to_add.append(meas)
                
                if measurements_to_add:
                    db.bulk_save_objects(measurements_to_add)
                
                db.commit()
            
            ds.close()
            print(f"Finished ingesting {file_path}")
            
        except Exception as e:
            print(f"Error reading or ingesting file {file_path}: {e}")
            import traceback
            traceback.print_exc()

def bootstrap_data():
    """
    Bootstraps the database tables and populates data from NetCDF.
    """
    init_db()
    db = SessionLocal()
    try:
        float_count = db.query(FloatMetadata).count()
        profile_count = db.query(Profile).count()
        measurement_count = db.query(Measurement).count()
        
        if float_count == 0 or profile_count == 0 or measurement_count == 0:
            print("Database tables are empty or incomplete. Starting fresh NetCDF ingestion...")
            
            # Clear tables to prevent foreign key errors or duplicate key conflicts
            db.query(Measurement).delete()
            db.query(Profile).delete()
            db.query(FloatMetadata).delete()
            db.commit()
            
            # Clear potentially corrupt old mock NetCDF files from data dir
            data_dir = "data"
            if os.path.exists(data_dir):
                for f in glob.glob(os.path.join(data_dir, "*.nc")):
                    try:
                        os.remove(f)
                    except Exception:
                        pass
                        
            ingest_netcdf_files(db, data_dir=data_dir)
        else:
            print(f"Database already contains {float_count} floats, {profile_count} profiles, and {measurement_count} measurements.")
    finally:
        db.close()

if __name__ == "__main__":
    bootstrap_data()
