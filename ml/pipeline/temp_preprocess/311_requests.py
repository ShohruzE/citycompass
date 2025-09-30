import calendar, time, re
from io import StringIO

import geopandas as gpd
import pandas as pd
import requests

# ---------------- CONFIG ----------------
START_YEAR, END_YEAR = 2020, 2025
END_MONTH = 9

BASE = "https://data.cityofnewyork.us/resource/erm2-nwe9.csv"
SELECT = "created_date,complaint_type,descriptor,incident_zip,borough,agency,latitude,longitude"
PAGE = 50_000
SLEEP = 0.4
APP_TOKEN = None  # optional Socrata token

MODZCTA_URL = "https://data.cityofnewyork.us/api/geospatial/pri4-ifjk?method=export&format=GeoJSON"

OUT_CSV = "311_monthly_by_modzcta.csv"

CATEGORY_BUCKETS = {
    "noise_total": [
        "Noise - Residential","Noise - Street/Sidewalk","Noise - Commercial",
        "Noise","Noise - Vehicle","Noise - Park","Loud Music/Party"
    ],
    "illegal_parking": ["Illegal Parking"],
    "heat_hot_water": ["Heat","Heat or Hot Water","HEAT/HOT WATER"],
    "sanitation": ["Sanitation Condition","Dirty Conditions","UNSANITARY CONDITION","Missed Collection"],
    "rodent": ["Rodent"],
    "homeless_assistance": ["Homeless Person Assistance"],
    "animal_abuse": ["Animal Abuse"],
    "taxi_complaint": ["Taxi Complaint"],
    "food_establishment": ["Food Establishment"],
    "street_light_condition": ["Street Light Condition"],
    "missed_collection": ["Missed Collection"],
}

# ✅ Hard-coded top complaint types (from your run)
TOP_TYPES = [
    "Illegal Parking", "Noise - Residential", "HEAT/HOT WATER", "Noise - Street/Sidewalk",
    "Blocked Driveway", "Request Large Bulky Item Collection", "UNSANITARY CONDITION",
    "Street Condition", "Noise - Vehicle", "Water System", "Noise - Commercial",
    "Abandoned Vehicle", "PLUMBING", "PAINT/PLASTER", "Noise"
]

AGENCY_BUCKETS = {
    "NYPD": "NYPD",
    "DSNY": "Sanitation",
    "DOT": "Transportation",
    "DHS": "Homeless",
    "HRA": "Homeless",
    "DOHMH": "Health",
}
# ---------------- CONFIG END ----------------


def fetch_month_df(y,m):
    days = calendar.monthrange(y,m)[1]
    start = f"{y:04d}-{m:02d}-01T00:00:00"
    end   = f"{y:04d}-{m:02d}-{days:02d}T23:59:59"
    params_base = {"$select": SELECT, "$where": f"created_date between '{start}' and '{end}'", "$limit": PAGE}
    headers = {"X-App-Token": APP_TOKEN} if APP_TOKEN else {}
    frames, offset = [], 0
    while True:
        p = dict(params_base); p["$offset"] = offset
        r = requests.get(BASE, params=p, headers=headers, timeout=120)
        r.raise_for_status()
        txt = r.text
        if not txt.strip(): break
        df = pd.read_csv(StringIO(txt))
        if df.empty: break
        frames.append(df)
        got = len(df)
        if got < PAGE: break
        offset += PAGE; time.sleep(SLEEP)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=SELECT.split(","))


def load_modzcta_and_xwalk():
    zcta = gpd.read_file(MODZCTA_URL)
    code_col = "MODZCTA" if "MODZCTA" in zcta.columns else ("modzcta" if "modzcta" in zcta.columns else None)
    if not code_col:
        raise ValueError(f"MODZCTA code column not found. Columns: {list(zcta.columns)}")
    xwalk = {}
    if "label" in zcta.columns:
        for _, row in zcta[[code_col,"label"]].dropna(subset=["label"]).iterrows():
            modz = str(row[code_col])
            zips = [z.strip() for z in str(row["label"]).split(",") if z.strip()]
            for z in zips:
                if re.fullmatch(r"\d{5}", z): xwalk[z] = modz
    return zcta, code_col, xwalk


def normalize_zip(z):
    if pd.isna(z): return None
    s = re.sub(r"[^\d]", "", str(z))
    return s[:5] if len(s) >= 5 else None


def month_to_agg(df, zcta, code_col, zip_to_modz):
    if df.empty:
        return pd.DataFrame(columns=["modzcta","month","total_requests"])

    df = df.copy()
    df["created_date"] = pd.to_datetime(df["created_date"], errors="coerce")
    df = df.dropna(subset=["created_date"])
    df["month"] = df["created_date"].dt.to_period("M").astype(str)

    # ZIP -> MODZCTA
    df["zip_norm"] = df["incident_zip"].apply(normalize_zip)
    df["modzcta"] = df["zip_norm"].map(zip_to_modz)

    # fallback: spatial join only for the remainder
    need_geo = df[df["modzcta"].isna() & df["latitude"].notna() & df["longitude"].notna()]
    if not need_geo.empty:
        gdf = gpd.GeoDataFrame(need_geo,
                               geometry=gpd.points_from_xy(need_geo.longitude, need_geo.latitude),
                               crs="EPSG:4326")
        if zcta.crs != gdf.crs:
            gdf = gdf.to_crs(zcta.crs)
        # robust sjoin: whatever column name comes out, rename -> 'modzcta'
        sj = gpd.sjoin(gdf, zcta[[code_col,"geometry"]], how="left", predicate="within")
        # figure out the code column in the joined frame
        join_code_col = None
        for c in ["modzcta","MODZCTA", code_col]:
            if c in sj.columns:
                join_code_col = c; break
        if join_code_col is None:
            # last-chance: pick any 5-digit-like column
            for c in sj.columns:
                vals = sj[c].dropna().astype(str).head(20)
                if len(vals) and vals.str.fullmatch(r"\d{5}").mean() > 0.6:
                    join_code_col = c; break
        if join_code_col is None:
            raise KeyError(f"Could not find MODZCTA code in sjoin result. Columns: {list(sj.columns)}")

        sj = sj.rename(columns={join_code_col: "modzcta"})
        sj = sj.drop(columns=[col for col in ["index_right","geometry"] if col in sj.columns])

        # write back into original df using matching indices
        df.loc[sj.index, "modzcta"] = sj["modzcta"].values

    # drop rows still without modzcta
    df = df.dropna(subset=["modzcta"])

    # base aggregate
    agg = df.groupby(["modzcta","month"]).size().reset_index(name="total_requests")

    # buckets
    for cname, vals in CATEGORY_BUCKETS.items():
        sub = df[df["complaint_type"].isin(vals)]
        sub = sub.groupby(["modzcta","month"]).size().rename(cname).reset_index()
        agg = agg.merge(sub, on=["modzcta","month"], how="left")

    # top complaint types
    if TOP_TYPES:
        pv = (
            df[df["complaint_type"].isin(TOP_TYPES)]
            .assign(v=1)
            .pivot_table(index=["modzcta","month"], columns="complaint_type", values="v",
                         aggfunc="sum", fill_value=0)
            .reset_index()
        )
        pv.columns = ["modzcta","month"] + [f"type__{c.replace(' ','_').replace('/','_')[:40]}" for c in pv.columns[2:]]
        agg = agg.merge(pv, on=["modzcta","month"], how="left")

    # agency groups
    df["agency_group"] = df["agency"].map(AGENCY_BUCKETS).fillna("Other")
    ag = df.groupby(["modzcta","month","agency_group"]).size().unstack(fill_value=0).reset_index()
    agg = agg.merge(ag, on=["modzcta","month"], how="left")

    # fill NaNs
    for c in agg.columns:
        if c not in ["modzcta","month"]:
            agg[c] = agg[c].fillna(0).astype(int)

    return agg.sort_values(["modzcta","month"])


def main():
    print("Loading MODZCTA polygons & ZIP crosswalk …")
    zcta, code_col, zip_to_modz = load_modzcta_and_xwalk()
    print(f"Using MODZCTA column: {code_col} | ZIPs mapped: {len(zip_to_modz):,}")

    first_write = True
    for y in range(START_YEAR, END_YEAR+1):
        last_m = 12 if y < END_YEAR else END_MONTH
        for m in range(1, last_m+1):
            print(f"\n== {y}-{m:02d} ==")
            df = fetch_month_df(y, m)
            print(f"Fetched {len(df):,} rows")
            if df.empty: continue
            agg = month_to_agg(df, zcta, code_col, zip_to_modz)
            print(f"Aggregated {len(agg):,} rows")
            mode = "w" if first_write else "a"
            agg.to_csv(OUT_CSV, index=False, mode=mode, header=first_write)
            first_write = False

    print(f"\nDone. Wrote: {OUT_CSV}")


if __name__ == "__main__":
    main()

