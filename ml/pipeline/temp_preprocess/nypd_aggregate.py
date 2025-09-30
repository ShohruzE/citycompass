import pandas as pd
import geopandas as gpd

#Load your incidents (already filtered 2020+ with minimal cols)
RAW = "nypd_monthly.csv"
df = pd.read_csv(RAW, parse_dates=["cmplnt_fr_dt"])
df = df.dropna(subset=["latitude", "longitude", "cmplnt_fr_dt"])

#Load MODZCTA polygons (your GeoJSON)
MODZCTA_URL = "https://data.cityofnewyork.us/api/geospatial/pri4-ifjk?method=export&format=GeoJSON"
zcta = gpd.read_file(MODZCTA_URL)

#Pick the right code column (upper or lower)
code_col = "MODZCTA" if "MODZCTA" in zcta.columns else "modzcta"

#Make points and align CRS
gdf = gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(df.longitude, df.latitude), crs="EPSG:4326")
if zcta.crs != gdf.crs:
    gdf = gdf.to_crs(zcta.crs)

#Spatial join: assign each incident to a MODZCTA
joined = gpd.sjoin(gdf, zcta[[code_col, "geometry"]], how="left", predicate="within")
joined = joined.rename(columns={code_col: "modzcta"}).drop(columns=["index_right", "geometry"])

#Build month key
joined["month"] = joined["cmplnt_fr_dt"].dt.to_period("M").astype(str)

#Aggregate to monthly × MODZCTA
agg = joined.groupby(["modzcta", "month"]).agg(
    total_incidents=("cmplnt_fr_dt", "count"),
    felonies=("law_cat_cd", lambda x: (x == "FELONY").sum()),
    misdemeanors=("law_cat_cd", lambda x: (x == "MISDEMEANOR").sum()),
    violations=("law_cat_cd", lambda x: (x == "VIOLATION").sum()),
    completed=("crm_atpt_cptd_cd", lambda x: (x == "COMPLETED").sum()),
    attempted=("crm_atpt_cptd_cd", lambda x: (x == "ATTEMPTED").sum())
).reset_index()

agg = agg.sort_values(["modzcta", "month"])
agg.to_csv("nypd_monthly_by_modzcta.csv", index=False)
print("Saved: nypd_monthly_by_modzcta.csv")

