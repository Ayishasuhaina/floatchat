import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Try to import netCDF4, if not available we will raise clear instruction
try:
    import netCDF4 as nc
except ImportError:
    nc = None

def generate_mock_netcdf(output_dir="data"):
    """
    Generates mock NetCDF files simulating ARGO floats.
    Creates 3 floats with several profiles over time (including March 2023, equatorial regions, Indian Ocean).
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    if nc is None:
        print("Warning: netCDF4 is not installed. Mock NetCDF files cannot be generated.")
        print("Please install netCDF4: pip install netcdf4 xarray pandas numpy")
        return

    print(f"Generating mock NetCDF files in '{output_dir}'...")

    # Configuration for 3 mock floats
    floats_config = [
        {
            "float_id": 5904620,  # Indian Ocean Float
            "lat_start": 12.5,
            "lon_start": 80.5,
            "drift_lat": 0.05,
            "drift_lon": 0.08,
            "start_date": datetime(2023, 1, 1),
            "num_profiles": 10,
        },
        {
            "float_id": 5904621,  # Equatorial Float
            "lat_start": 0.1,
            "lon_start": 75.0,
            "drift_lat": -0.01,
            "drift_lon": 0.12,
            "start_date": datetime(2023, 3, 1),  # Specifically covers March 2023
            "num_profiles": 8,
        },
        {
            "float_id": 5904622,  # Arabian Sea Float
            "lat_start": 18.0,
            "lon_start": 65.0,
            "drift_lat": 0.03,
            "drift_lon": -0.04,
            "start_date": datetime(2023, 2, 15),
            "num_profiles": 12,
        }
    ]

    # Standard ARGO depth levels (in decibars / meters roughly)
    depth_levels = np.array([0, 10, 20, 50, 100, 150, 200, 300, 500, 700, 1000, 1500, 2000], dtype='float32')
    num_levels = len(depth_levels)

    for fl in floats_config:
        float_id = fl["float_id"]
        file_path = os.path.join(output_dir, f"R{float_id}_prof.nc")
        
        # Open NetCDF dataset for writing
        rootgrp = nc.Dataset(file_path, "w", format="NETCDF4")
        
        # Create dimensions
        # N_PROF is the number of profiles (time-series points)
        # N_LEVELS is the vertical depth levels
        n_prof = fl["num_profiles"]
        rootgrp.createDimension("N_PROF", n_prof)
        rootgrp.createDimension("N_LEVELS", num_levels)
        rootgrp.createDimension("STRING8", 8)

        # Create variables
        # Float ID
        plat_num = rootgrp.createVariable("PLATFORM_NUMBER", "c", ("N_PROF", "STRING8"))
        # Location and Time
        lats = rootgrp.createVariable("LATITUDE", "f4", ("N_PROF",))
        lons = rootgrp.createVariable("LONGITUDE", "f4", ("N_PROF",))
        juld = rootgrp.createVariable("JULD", "f8", ("N_PROF",)) # Julian Day
        
        # Profiles (depth, temp, salinity, oxygen)
        pres = rootgrp.createVariable("PRES", "f4", ("N_PROF", "N_LEVELS"))
        temp = rootgrp.createVariable("TEMP", "f4", ("N_PROF", "N_LEVELS"))
        psal = rootgrp.createVariable("PSAL", "f4", ("N_PROF", "N_LEVELS"))
        doxy = rootgrp.createVariable("DOXY", "f4", ("N_PROF", "N_LEVELS"))

        # QC Flag variables (represented as string arrays or bytes)
        # We'll use character arrays or numeric arrays. In real NetCDF it's usually char or byte.
        # We will write QC variables as byte/char arrays. For simplicity in parsing, numeric or byte flags works.
        # ARGO QC: '1'=Good, '2'=Probably Good, '3'=Probably Bad, '4'=Bad
        # Let's create numeric QC variables (or char, standard is byte/char, we'll store as integers 1,2,3,4 for easier simulation)
        temp_qc = rootgrp.createVariable("TEMP_QC", "i4", ("N_PROF", "N_LEVELS"))
        psal_qc = rootgrp.createVariable("PSAL_QC", "i4", ("N_PROF", "N_LEVELS"))
        doxy_qc = rootgrp.createVariable("DOXY_QC", "i4", ("N_PROF", "N_LEVELS"))

        # Add units and descriptive attributes
        rootgrp.description = f"Mock ARGO float dataset for float {float_id}"
        rootgrp.history = "Created for FloatChat SIH hackathon prototype"
        rootgrp.source = "ARGO program simulation"

        lats.units = "degrees_north"
        lons.units = "degrees_east"
        juld.units = "days since 1950-01-01 00:00:00 UTC"
        pres.units = "decibar"
        temp.units = "degree_Celsius"
        psal.units = "psu"
        doxy.units = "micromole/kg"

        # Populate coordinates
        lat_arr = np.zeros(n_prof, dtype='float32')
        lon_arr = np.zeros(n_prof, dtype='float32')
        juld_arr = np.zeros(n_prof, dtype='float64')
        plat_arr = []

        base_date = fl["start_date"]
        # Julian base is 1950-01-01
        julian_base = datetime(1950, 1, 1)

        for p in range(n_prof):
            profile_date = base_date + timedelta(days=p * 10) # 10 days cycle
            julian_day = (profile_date - julian_base).total_seconds() / (24 * 3600)
            
            lat_arr[p] = fl["lat_start"] + fl["drift_lat"] * p
            lon_arr[p] = fl["lon_start"] + fl["drift_lon"] * p
            juld_arr[p] = julian_day
            plat_arr.append(f"{float_id:<8}")

        # Write coordinates
        lats[:] = lat_arr
        lons[:] = lon_arr
        juld[:] = juld_arr
        
        # Platform number string array
        for i, val in enumerate(plat_arr):
            plat_num[i, :] = list(val)

        # Generate profile measurements with realistic physical properties
        # Temperature: decreases with depth (thermocline)
        # Salinity: increases/varies with depth
        # Oxygen: decreases then stabilizes (oxygen minimum zone)
        for p in range(n_prof):
            # Pres is roughly equivalent to depth (meters)
            pres[p, :] = depth_levels

            # Dynamic surface temperature depending on latitude (equator is hotter, India is hot)
            surface_temp = 29.5 - 0.5 * abs(lat_arr[p])
            # T(z) = T_bottom + (T_surf - T_bottom) * exp(-z / scale)
            temp_profile = 4.0 + (surface_temp - 4.0) * np.exp(-depth_levels / 250.0)
            # Add small random noise
            temp_profile += np.random.normal(0, 0.05, num_levels)

            # Salinity: typical range 34.0 to 36.5
            # S(z) has a surface layer, sub-surface maximum/minimum
            sal_profile = 34.5 + 1.2 * (1.0 - np.exp(-depth_levels / 150.0))
            if lat_arr[p] > 10.0:  # Arabian Sea is high salinity
                sal_profile += 0.5
            sal_profile += np.random.normal(0, 0.03, num_levels)

            # Oxygen: typical range 50 to 230 µmol/kg
            # Low in 200m - 800m depth (Oxygen Minimum Zone)
            oxy_profile = 220.0 - 150.0 * np.exp(-((depth_levels - 350.0) / 250.0)**2)
            # Make sure it doesn't drop below 10
            oxy_profile = np.clip(oxy_profile, 15.0, 240.0)
            oxy_profile += np.random.normal(0, 2.0, num_levels)

            # QC flags: 1 = Good, 4 = Bad
            t_qc = np.ones(num_levels, dtype='int32')
            s_qc = np.ones(num_levels, dtype='int32')
            o_qc = np.ones(num_levels, dtype='int32')

            # Inject a few bad measurements (QC=4) to verify filtering
            if p == 2:
                # Level index 3 is bad for temperature
                t_qc[3] = 4
                temp_profile[3] = -99.9  # extreme value
            if p == 4:
                # Level index 6 is bad for salinity
                s_qc[6] = 4
                sal_profile[6] = 0.0  # extreme value
            if p == 5:
                # Level index 8 is bad for oxygen
                o_qc[8] = 4
                oxy_profile[8] = 999.9

            temp[p, :] = temp_profile
            psal[p, :] = sal_profile
            doxy[p, :] = oxy_profile
            
            temp_qc[p, :] = t_qc
            psal_qc[p, :] = s_qc
            doxy_qc[p, :] = o_qc

        rootgrp.close()
        print(f"Generated mock file: {file_path}")

if __name__ == "__main__":
    generate_mock_netcdf("../data")
