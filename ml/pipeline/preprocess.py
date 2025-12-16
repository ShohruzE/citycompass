# ml/pipeline/preprocess.py
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

# -----------------------------------------
# CONFIGURATION
# -----------------------------------------
DEFAULT_DATA_FOLDER = Path("ml/data/raw")

# -----------------------------------------
# NUMERIC CLEANER
# -----------------------------------------
def to_numeric_clean(x):
    """Convert values like '$1,234' or '5%' to floats."""
    if isinstance(x, str):
        s = x.strip()
        if s.endswith("%"):
            s = s[:-1]
        s = s.replace("$", "").replace(",", "")
        try:
            return float(s)
        except:
            return np.nan
    return pd.to_numeric(x, errors="coerce")

# -----------------------------------------
# PARSE ONE WORKBOOK
# -----------------------------------------
def parse_furman_profile_one_workbook(path: Path) -> pd.DataFrame:
    """Parses a single Furman Excel workbook into a clean long format."""
    xls = pd.ExcelFile(path)
    data_sheets = [s for s in xls.sheet_names if "Data" in s]
    if not data_sheets:
        raise ValueError(f"No sheet with 'Data' in {path.name}")

    raw = pd.read_excel(xls, sheet_name=data_sheets[0], header=None)

    # Locate header row
    hdr_mask = raw.apply(
        lambda r: r.astype(str).str.contains("Community District", case=False, na=False).any(), axis=1
    )
    hdr_idx = hdr_mask.idxmax()
    header = list(raw.iloc[hdr_idx])
    df = raw.iloc[hdr_idx + 1:].copy()
    df.columns = header
    df = df.dropna(how="all").dropna(how="all", axis=1)

    df = df.rename(columns={
        "Community District": "community_district",
        "Name": "name",
        "Indicator Category": "indicator_category",
        "Indicator": "indicator",
        "Indicator Description": "indicator_description",
    })

    # Melt year columns into long format
    year_cols = [c for c in df.columns if str(c).isdigit() and len(str(c)) == 4]
    id_vars = ["community_district", "name", "indicator_category", "indicator", "indicator_description"]
    id_vars = [c for c in id_vars if c in df.columns]

    long_df = df.melt(id_vars=id_vars, value_vars=year_cols, var_name="year", value_name="value")
    long_df["value"] = long_df["value"].apply(to_numeric_clean)
    long_df["year"] = pd.to_numeric(long_df["year"], errors="coerce").astype("Int64")
    long_df = long_df.dropna(subset=["year"])
    long_df["community_district"] = long_df["community_district"].astype(str).str.strip()
    long_df["name"] = long_df["name"].astype(str).str.strip()
    long_df["indicator"] = long_df["indicator"].astype(str).str.strip()
    return long_df

# -----------------------------------------
# MAIN PIPELINE
# -----------------------------------------
def build_furman_dataset(folder: Path = DEFAULT_DATA_FOLDER) -> pd.DataFrame:
    """Full preprocessing pipeline replicating notebook logic."""
    assert folder.exists(), f"Folder not found: {folder}"
    files = sorted([p for p in folder.glob("*.xlsx")] + [p for p in folder.glob("*.xls")])
    assert files, f"No Excel files found in {folder}"

    # Parse all workbooks
    frames = []
    for p in files:
        try:
            frames.append(parse_furman_profile_one_workbook(p))
        except Exception as e:
            print(f"Skipping {p.name}: {e}")
    tidy_all = pd.concat(frames, ignore_index=True)

    # Keep target years
    KEEP_YEARS = {2010, 2019, 2021, 2022}
    tidy_all = tidy_all[tidy_all["year"].isin(KEEP_YEARS)]

    # Pivot to wide format
    wide_all = (
        tidy_all
        .pivot_table(index=["community_district", "name", "year"],
                     columns="indicator", values="value", aggfunc="first")
        .reset_index()
    )

    # Indicators where higher = worse
    NEGATIVE = {
        "Poverty rate",
        "Poverty rate, population aged 65+",
        "Poverty rate, population under 18 years old",
        "Unemployment rate",
        "Gross rent as a share of household income (rent burden)",
        "Moderately rent-burdened households",
        "Moderately rent-burdened households, low income",
        "Moderately rent-burdened households, moderate income",
        "Severely rent-burdened households",
        "Severely rent-burdened households, low income",
        "Severely rent-burdened households, moderate income",
        "Serious housing code violations (per 1,000 privately owned rental units)",
        "Total housing code violations (per 1,000 privately owned rental units)",
        "Serious crime rate (per 1,000 residents)",
        "Serious crime rate, violent (per 1,000 residents)",
        "Serious crime rate, property (per 1,000 residents)",
        "Notices of foreclosure rate (per 1,000 1-4 family and condo properties)",
        "Pre-foreclosure notice rate (per 1,000 1-4 family and condo properties)",
        "Severe crowding rate (% of renter households)",
        "Mean travel time to work (minutes)",
    }

    id_cols = ["community_district", "name", "year"]
    value_cols = [c for c in wide_all.columns if c not in id_cols]

    # Compute z-scores and quality score per year
    X_list = []
    for y, block in wide_all.groupby("year"):
        X = block[value_cols].apply(pd.to_numeric, errors="coerce")
        scaler = StandardScaler()
        Xz = pd.DataFrame(scaler.fit_transform(X), columns=value_cols, index=block.index)
        for col in Xz.columns:
            if col in NEGATIVE:
                Xz[col] = -Xz[col]
        enough = Xz.notna().sum(axis=1) >= 3
        qs = Xz.mean(axis=1, skipna=True)
        block = block.copy()
        block["quality_score"] = np.where(enough, qs, np.nan)
        X_list.append(block)
    wide_all = pd.concat(X_list).sort_values(id_cols).reset_index(drop=True)

    # Compute top drivers
    def compute_Xz_per_year(wide, value_cols, negative_set):
        out = {}
        for y, block in wide.groupby("year"):
            X = block[value_cols].apply(pd.to_numeric, errors="coerce")
            scaler = StandardScaler()
            Xz = pd.DataFrame(scaler.fit_transform(X), columns=value_cols, index=block.index)
            for col in Xz.columns:
                if col in negative_set:
                    Xz[col] = -Xz[col]
            out[y] = Xz
        return out

    Xz_by_year = compute_Xz_per_year(wide_all, value_cols, NEGATIVE)

    def top_k_drivers_for_row(row, k=3):
        y = int(row["year"])
        idx = row.name
        z = Xz_by_year[y].loc[idx].dropna()
        if z.empty:
            return ""
        top = z.reindex(z.abs().sort_values(ascending=False).index)[:k]
        return ", ".join([f"{c} ({v:+.2f})" for c, v in top.items()])

    wide_all["top3_drivers"] = wide_all.apply(top_k_drivers_for_row, axis=1)

    # Monthly interpolation
    def interpolate_all_numeric(df_cd):
        dt_index = pd.to_datetime(df_cd["year"].astype(int).astype(str) + "-01-01")
        df = df_cd.set_index(dt_index)
        num_cols = df.select_dtypes(include=[np.number]).columns
        df = df[num_cols]
        rng = pd.date_range(df.index.min(), df.index.max(), freq="MS")
        df = df.reindex(rng)
        df = df.interpolate(method="time")
        df["month"] = df.index
        return df.reset_index(drop=True)

    monthly_rows = []
    for (cd, nm), g in wide_all.groupby(["community_district", "name"], dropna=False):
        m = interpolate_all_numeric(g)
        m["community_district"] = cd
        m["name"] = nm
        monthly_rows.append(m)
    furman_monthly = pd.concat(monthly_rows, ignore_index=True).sort_values(["community_district", "month"])

    # Future 6-month label
    furman_monthly["quality_score_t_plus_6m"] = (
        furman_monthly.groupby("community_district")["quality_score"].shift(-6)
    )

    # Percentile + Index + Grade
    furman_monthly["quality_percentile_month"] = (
        furman_monthly.groupby("month")["quality_score"].rank(pct=True) * 100
    )

    qmin, qmax = furman_monthly["quality_score"].min(), furman_monthly["quality_score"].max()
    furman_monthly["quality_index_0_100"] = 100 * (furman_monthly["quality_score"] - qmin) / (qmax - qmin)

    def to_grade(p):
        if pd.isna(p): return None
        if p >= 90: return "A+"
        if p >= 80: return "A"
        if p >= 70: return "B"
        if p >= 60: return "C"
        if p >= 40: return "D"
        return "F"

    furman_monthly["quality_grade"] = furman_monthly["quality_percentile_month"].apply(to_grade)

    # Attach yearly drivers to monthly
    drivers_yearly = (
        wide_all[["community_district", "year", "top3_drivers"]]
        .assign(month=lambda d: pd.to_datetime(d["year"].astype(int).astype(str) + "-01-01"))
    )

    furman_monthly = furman_monthly.merge(
        drivers_yearly[["community_district", "month", "top3_drivers"]],
        on=["community_district", "month"], how="left"
    )

    furman_monthly["year_tmp"] = furman_monthly["month"].dt.year
    furman_monthly["top3_drivers"] = (
        furman_monthly
        .sort_values(["community_district", "month"])
        .groupby(["community_district", "year_tmp"])["top3_drivers"]
        .ffill()
    )
    furman_monthly = furman_monthly.drop(columns=["year_tmp"])

    # -----------------------------------------
    # SANITIZE COLUMN NAMES TO MATCH TRAINING
    # -----------------------------------------
    import re
    
    def sanitize(name: str) -> str:
        s = str(name)
        s = s.replace("%", "pct").replace("$", "usd")
        s = re.sub(r"[^\w]+", "_", s)
        s = re.sub(r"_+", "_", s).strip("_")
        s = s.lower()
        return s[:120]
    
    renamed = {c: sanitize(c) for c in furman_monthly.columns}
    furman_monthly.rename(columns=renamed, inplace=True)
    
    return furman_monthly


# -----------------------------------------
# STANDALONE RUN
# -----------------------------------------
if __name__ == "__main__":
    df = build_furman_dataset()
    print("Furman dataset built successfully.")
    print(df.head())
