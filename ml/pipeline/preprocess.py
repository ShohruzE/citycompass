# import re
import logging
from pathlib import Path 
from typing import Optional
import time

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

COMMON_DATE_COLS = [
    "date", "created_date", "created", "inspection_date", "issued_date", "issue_date",
    "reported_date", "report_date", "datetime", "start_date", "end_date"
]

COMMON_ZIP_COLS = ["zipcode", "zip", "postal_code", "postalcode", "post_code"]
COMMON_BORO_COLS = ["borough", "boro", "borough_name"]

def _normalize_cols(df: pd.DataFrame) -> pd.DataFrame:
    # Lowercase and strip column names
    df = df.rename(columns={c: c.strip().lower() for c in df.columns})
    return df

def _find_date_column(df: pd.DataFrame) -> Optional[str]:
    # Try common names first
    for c in COMMON_DATE_COLS:
        if c in df.columns:
            return c
    # fallback: any datetime-like column
    for c in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[c]):
            return c
        # if values look like ISO/dates, pick the first matching sample
        if df[c].dropna().astype(str).str.match(r"\d{4}-\d{2}-\d{2}").any():
            return c
    return None

def _parse_dates(df: pd.DataFrame, date_col: str) -> pd.DataFrame:
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce", utc=False)
    return df

def detect_and_filter_by_date(df: pd.DataFrame, start_date: str = "2010-01-01") -> pd.DataFrame:
    """
    Detect a date column, parse it, and filter rows with date >= start_date.
    If no date column is found, returns original df (optionally you may drop).
    """
    df = _normalize_cols(df)
    date_col = _find_date_column(df)
    if not date_col:
        logger.warning("No date column detected; skipping date filtering.")
        return df

    df = _parse_dates(df, date_col)
    start = pd.to_datetime(start_date)
    before = len(df)
    df = df[df[date_col].notna() & (df[date_col] >= start)]
    after = len(df)
    logger.info("Filtered by date %s: %d -> %d rows", start_date, before, after)
    return df


def _read_file_to_df(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in [".csv"]:
        return pd.read_csv(path)
    if path.suffix.lower() in [".parquet", ".pq"]:
        return pd.read_parquet(path)
    if path.suffix.lower() in [".json"]:
        return pd.read_json(path, lines=False)
    raise ValueError(f"Unsupported file type: {path}")


def preprocess_raw_folder(
    raw_dir: str = "ml/data/raw",
    processed_dir: str = "ml/data/processed",
    start_date: str = "2010-01-01",
) -> None:
    """
    Process all supported files in raw_dir, clean them, and write to processed_dir.
    Saved filenames will match input but with the chosen extension.
    """
    raw_path = Path(raw_dir)
    out_path = Path(processed_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    for p in sorted(raw_path.iterdir()):
        if not p.is_file() or p.suffix.lower() not in [".csv", ".json", ".parquet", ".pq"]:
            continue
        logger.info("Processing raw file: %s", p.name)
        try:
            df = _read_file_to_df(p)
            df = detect_and_filter_by_date(df, start_date=start_date)
            out_file = out_path / (p.stem + ".csv")
            df.to_csv(out_file, index=False)
            logger.info("Wrote processed file: %s", out_file)
        except Exception as e:
            logger.exception("Failed to process %s: %s", p, e)


def fetch_and_preprocess_api(
    url: str,
    processed_dir: str = "ml/data/processed",
    start_date: str = "2010-01-01",
    limit: int = 50000,
    params: dict = None,
    save_name: Optional[str] = None,
    timeout: int = 30,
    retries: int = 3,
    backoff_factor: float = 0.3,
    paginate: bool = True,
    chunk_size: int = 2000,
    sleep: float = 0.15,
) -> pd.DataFrame:
    """
    Fetch a JSON endpoint, convert to DataFrame, clean and save.
    Example usage:
      fetch_and_preprocess_api('https://data.cityofnewyork.us/resource/erm2-nwe9.json')
    """
    params = params or {}
    # Socrata style $limit param
    params.setdefault("$limit", limit)

    logger.info("Fetching API: %s", url)

    # configure session with retries
    session = requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET",),
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    def _fetch_page(limit: int, offset: int):
        page_params = dict(params)
        page_params["$limit"] = limit
        page_params["$offset"] = offset
        r = session.get(url, params=page_params, timeout=timeout)
        r.raise_for_status()
        return r.json()

    data = []
    try:
        if paginate:
            offset = 0
            while True:
                logger.info("Fetching page: limit=%d offset=%d", chunk_size, offset)
                page = _fetch_page(chunk_size, offset)
                if not page:
                    break
                data.extend(page)
                offset += len(page)
                # stop if we've reached an explicit upper bound
                if limit and offset >= limit:
                    break

                time.sleep(sleep)
        else:
            resp = session.get(url, params=params, timeout=timeout)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.exception("Failed to fetch API %s: %s", url, e)
        raise

    df = pd.json_normalize(data)
    df = detect_and_filter_by_date(df, start_date=start_date)

    out_path = Path(processed_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    name = save_name or (Path(url).stem or "api_data")
    csv_out = out_path / f"{name}.csv"
    df.to_csv(csv_out, index=False)
    return df


if __name__ == "__main__":
    preprocess_raw_folder()

    param1 = {"$where": "created_date >= '2010-01-01T00:00:00'", "$limit": 1000}
    param2 = {"$where": "CMPLNT_FR_DT >= '2010-01-01T00:00:00'", "$limit": 1000}

    fetch_and_preprocess_api("https://data.cityofnewyork.us/resource/erm2-nwe9.json", params=param1, paginate=False, timeout=120, save_name="311_complaints")
    fetch_and_preprocess_api("https://data.cityofnewyork.us/resource/qgea-i56i.json", params=param2, paginate=False, timeout=120, save_name="nypd_complaints")

