from fastapi import APIRouter, HTTPException, Query
import requests
import time

from app.core.config import get_settings

router = APIRouter(prefix="/acs", tags=["ACS"])

_CACHE = {}
_CACHE_TTL = 3600

ACS_VARS = {
    "B01003_001E": "total_population",
    "B19013_001E": "median_household_income",
    "B25077_001E": "median_age",
    "B17001_002E": "poverty_count",
    "B17001_001E": "poverty_total",
}


# zip code to ACS ZCTA mapping API endpoint
def _fetch_acs_zcta(zcta: str) -> dict:
    settings = get_settings()
    api_key = getattr(settings, "ACS_API_KEY", None)

    if not api_key:
        raise HTTPException(status_code=500, detail="ACS API key not configured")

    key = f"zcta: {zcta}"
    current_time = time.time()
    cached = _CACHE.get(key)
    if cached and current_time - cached["timestamp"] < _CACHE_TTL:
        return cached["data"]

    vars_str = ",".join(ACS_VARS.keys())
    url = f"https://api.census.gov/data/2023/acs/acs5?get={vars_str}&for=zip%20code%20tabulation%20area:{zcta}&key={api_key}"

    response = requests.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch data from ACS API")

    data = response.json()
    if len(data) < 2:
        raise HTTPException(
            status_code=404, detail="No data found for the provided ZCTA"
        )

    header, values = data[0], data[1]
    raw = dict(zip(header, values))

    out = {"zcta": zcta, "name": raw.get("NAME", "")}
    for acs_var, acs_name in ACS_VARS.items():
        val = raw.get(acs_var)

        try:
            out[acs_name] = None if val in (None, "", "NA") else float(val)
        except Exception:
            out[acs_name] = None

    # compute poverty rate
    if out.get("poverty_count") is not None and out.get("poverty_total") not in (
        0,
        None,
    ):
        out["poverty_rate"] = out["poverty_count"] / out["poverty_total"]
    else:
        out["poverty_rate"] = None

    _CACHE[key] = {"data": out, "timestamp": current_time}

    return out


@router.get("/neighborhood", summary="Get ACS data for a given neighborhood")
def neighborhood_stats(
    zip: str = Query(
        ...,
        min_length=5,
        max_length=5,
        description="The ZIP code to retrieve ACS data for",
    ),
):
    """
    example: /api/acs/neighborhood?zip=90210
    """
    try:
        return _fetch_acs_zcta(zip)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
