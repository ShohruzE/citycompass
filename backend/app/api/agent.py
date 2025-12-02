# backend/app/api/agent.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import json
import re

from ollama import Client
client = Client(host="http://host.docker.internal:11434")

from ml.pipeline.utils import load_model_bundle, build_citywide_predictions

router = APIRouter(prefix="/agent", tags=["Neighborhood Advisor Agent"])

# ----------------------------------------------------------
# Load model + citywide predictions once on startup
# ----------------------------------------------------------

try:
    MODEL_BUNDLE = load_model_bundle()
    CITYWIDE_DF = build_citywide_predictions()
except Exception as e:
    print(f"⚠️ Failed to initialize Neighborhood Advisor Agent: {e}")
    MODEL_BUNDLE = None
    CITYWIDE_DF = None


class AgentQuery(BaseModel):
    question: str


# ----------------------------------------------------------
# Borough maps
# ----------------------------------------------------------

BOROUGH_KEYWORDS = {
    "MANHATTAN": "Manhattan",
    "BROOKLYN": "Brooklyn",
    "QUEENS": "Queens",
    "BRONX": "Bronx",
    "STATENISLAND": "Staten Island",
    "STATEN ISLAND": "Staten Island",
}

BOROUGH_PREFIX = {
    "Manhattan": "MN",
    "Brooklyn": "BK",
    "Queens": "QN",
    "Bronx": "BX",
    "Staten Island": "SI",
}


# ----------------------------------------------------------
# Metric mapping: keyword -> (metric_name, ascending)
# ascending = True  → lower values are "better" (e.g. crime, violations)
# ascending = False → higher values are "better" (e.g. income, NSQI)
# ----------------------------------------------------------

metric_map: Dict[str, tuple[str, bool]] = {
    # -----------------------------
    # SAFETY (lower = safer)
    # -----------------------------
    "safest": ("serious_crime_rate_per_1_000_residents", True),
    "safe": ("serious_crime_rate_per_1_000_residents", True),
    "crime": ("serious_crime_rate_per_1_000_residents", True),
    "violent crime": ("serious_crime_rate_violent_per_1_000_residents", True),
    "property crime": ("serious_crime_rate_property_per_1_000_residents", True),

    # -----------------------------
    # CLEANLINESS / HOUSING QUALITY (lower = cleaner/better)
    # -----------------------------
    "cleanest": ("total_housing_code_violations_per_1_000_privately_owned_rental_units", True),
    "clean": ("total_housing_code_violations_per_1_000_privately_owned_rental_units", True),
    "housing violations": ("serious_housing_code_violations_per_1_000_privately_owned_rental_units", True),
    "code violations": ("total_housing_code_violations_per_1_000_privately_owned_rental_units", True),
    "crowding": ("severe_crowding_rate_pct_of_renter_households", True),

    # -----------------------------
    # AFFORDABILITY (lower rent = more affordable)
    # -----------------------------
    "cheapest": ("median_rent_all_2024usd", True),
    "cheap": ("median_rent_all_2024usd", True),
    "affordable": ("median_rent_all_2024usd", True),
    "expensive": ("median_rent_all_2024usd", False),
    "rent": ("median_rent_all_2024usd", True),
    "low rent": ("median_rent_all_2024usd", True),
    "high rent": ("median_rent_all_2024usd", False),

    # -----------------------------
    # ECONOMIC STATUS
    # -----------------------------
    "richest": ("median_household_income_2024usd", False),
    "wealthiest": ("median_household_income_2024usd", False),
    "poorest": ("median_household_income_2024usd", True),
    "low income": ("median_household_income_2024usd", True),
    "high income": ("median_household_income_2024usd", False),
    "income": ("median_household_income_2024usd", False),

    # -----------------------------
    # EDUCATION
    # -----------------------------
    "best schools": ("students_performing_at_grade_level_in_math_4th_grade", False),
    "good schools": ("students_performing_at_grade_level_in_math_4th_grade", False),
    "highest test scores": ("students_performing_at_grade_level_in_math_4th_grade", False),
    "test scores": ("students_performing_at_grade_level_in_english_language_arts_4th_grade", False),

    # -----------------------------
    # HOUSING SUPPLY / PERMITS
    # -----------------------------
    "new housing": ("units_authorized_by_new_residential_building_permits", False),
    "new buildings": ("units_authorized_by_new_residential_building_permits", False),
    "building permits": ("units_authorized_by_new_residential_building_permits", False),
    "certificates of occupancy": ("units_issued_new_certificates_of_occupancy", False),

    # -----------------------------
    # DIVERSITY
    # -----------------------------
    "diverse": ("racial_diversity_index", False),
    "most diverse": ("racial_diversity_index", False),

    # -----------------------------
    # POPULATION & DENSITY
    # -----------------------------
    "densest": ("population_density_1_000_persons_per_square_mile", False),
    "least dense": ("population_density_1_000_persons_per_square_mile", True),
    "population": ("population", False),

    # -----------------------------
    # FINANCIAL DISTRESS
    # -----------------------------
    "foreclosure": ("notices_of_foreclosure_rate_per_1_000_1_4_family_and_condo_properties", True),
    "pre foreclosure": ("pre_foreclosure_notice_rate_per_1_000_1_4_family_and_condo_properties", True),

    # -----------------------------
    # COMMUTE / TRANSIT
    # -----------------------------
    "commute": ("mean_travel_time_to_work_minutes", True),
    "short commute": ("mean_travel_time_to_work_minutes", True),
    "long commute": ("mean_travel_time_to_work_minutes", False),

    # -----------------------------
    # RENT BURDEN
    # -----------------------------
    "rent burden": ("severely_rent_burdened_households", True),
    "rent burdened": ("severely_rent_burdened_households", True),
    "severely rent burdened": ("severely_rent_burdened_households", True),

    # -----------------------------
    # REAL ESTATE: HOME PRICES
    # (use 1-family building as proxy)
    # -----------------------------
    "home price": ("median_sales_price_per_unit_1_family_building_2024usd", False),
    "expensive homes": ("median_sales_price_per_unit_1_family_building_2024usd", False),
    "cheap homes": ("median_sales_price_per_unit_1_family_building_2024usd", True),

    # -----------------------------
    # DEVELOPMENT ACTIVITY
    # -----------------------------
    "sales volume": ("sales_volume_all_property_types", False),

    # -----------------------------
    # NSQI DEFAULT
    # -----------------------------
    "quality": ("nsqi_index", False),
    "best neighborhoods": ("nsqi_index", False),
    "worst neighborhoods": ("nsqi_index", True),
}


# ----------------------------------------------------------
# Helper functions for interpretation
# ----------------------------------------------------------

NUM_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
}


def infer_borough_from_text(question: str) -> Optional[str]:
    upper = question.upper()
    upper = upper.replace(",", " ").replace(".", " ")
    for key, borough in BOROUGH_KEYWORDS.items():
        if key in upper:
            return borough
    return None


def infer_metric_from_text(question: str) -> tuple[str, bool]:
    text = question.lower()
    for key, (metric, ascending) in metric_map.items():
        if key in text:
            return metric, ascending
    # default to NSQI if nothing matched
    return "nsqi_index", False


def infer_intent_from_text(question: str) -> str:
    q = question.lower()
    if any(word in q for word in ["best", "top", "safest", "cleanest", "nicest"]):
        return "top"
    if any(word in q for word in ["worst", "most dangerous", "dirtiest", "least safe"]):
        return "bottom"
    return "generic"


def infer_top_n_from_text(question: str) -> int:
    q = question.lower()

    # explicit digits
    nums = re.findall(r"\b\d+\b", q)
    if nums:
        try:
            return int(nums[0])
        except ValueError:
            pass

    # number words
    for word, value in NUM_WORDS.items():
        if word in q:
            return value

    # "top neighborhoods" → default 5
    if "neighborhoods" in q or "top" in q:
        return 5

    # singular "neighborhood" → default 1
    if "neighborhood" in q:
        return 1

    # final fallback
    return 5


# ----------------------------------------------------------
# LLM-Powered Interpreter (Ollama + heuristics)
# ----------------------------------------------------------

def interpret_with_llm(question: str) -> Dict[str, Any]:
    """
    1. Ask Ollama for a JSON guess (borough/intent/top_n/metric).
    2. Robustly parse JSON (strip extra text, markdown, etc.).
    3. Override/augment with our own heuristic mapping:
       - borough by keywords
       - metric by metric_map
       - top_n from number words/digits
    """
    base_struct: Dict[str, Any] = {}

    prompt = f"""
You are a parser for NYC neighborhood questions.

Question: "{question}"

Return ONLY a JSON object, no explanation, no markdown. Example:

{{
  "borough": "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island" | null,
  "intent": "top" | "bottom" | "trend" | "generic",
  "top_n": 5,
  "metric": "nsqi_index"
}}
"""

    try:
        response = client.chat(
            model="llama3.2:3b",
            messages=[{"role": "user", "content": prompt}],
            stream=False,
        )
        raw = response["message"]["content"]

        # Try to extract JSON substring between first { and last }
        if "{" in raw and "}" in raw:
            json_str = raw[raw.index("{"): raw.rindex("}") + 1]
        else:
            json_str = raw

        parsed = json.loads(json_str)

        if isinstance(parsed, dict):
            base_struct = parsed
        else:
            base_struct = {}

    except Exception as e:
        print(f"⚠️ LLM interpretation failed: {e}")
        base_struct = {}

    # ---- Heuristic enrichments / overrides ----
    borough = base_struct.get("borough")
    if not borough:
        borough = infer_borough_from_text(question)

    metric, ascending = infer_metric_from_text(question)

    intent = base_struct.get("intent") or infer_intent_from_text(question)
    top_n = base_struct.get("top_n")
    if top_n is None:
        top_n = infer_top_n_from_text(question)

    try:
        top_n = int(top_n)
    except Exception:
        top_n = 5

    structured = {
        "borough": borough,
        "intent": intent,
        "top_n": top_n,
        "metric": metric,
        "ascending": ascending,
    }

    return structured


# ----------------------------------------------------------
# Core agent logic
# ----------------------------------------------------------

def answer_question(structured: Dict[str, Any]) -> List[Dict[str, Any]]:
    if CITYWIDE_DF is None:
        raise RuntimeError("Citywide prediction dataframe not initialized")

    df = CITYWIDE_DF.copy()

    borough: Optional[str] = structured.get("borough")
    intent: str = structured.get("intent", "generic")
    top_n: int = int(structured.get("top_n") or 5)
    metric: str = structured.get("metric", "nsqi_index")
    ascending: Optional[bool] = structured.get("ascending")

    if metric not in df.columns:
        raise ValueError(f"Metric '{metric}' not found in dataframe")

    # filter by borough using community_district prefix (MN, BK, BX, QN, SI)
    if borough:
        prefix = BOROUGH_PREFIX.get(borough)
        if prefix and "community_district" in df.columns:
            df = df[df["community_district"].str.startswith(prefix)]
        # if no rows after filtering, we just fall back to citywide
        if df.empty:
            print(f"⚠️ No rows found for borough={borough}, falling back to all NYC")
            df = CITYWIDE_DF.copy()

    # If ascending wasn't explicitly set, derive from intent
    if ascending is None:
        ascending = (intent == "bottom")

    # take latest per community district (most recent month)
    if "month" in df.columns and "community_district" in df.columns:
        df = (
            df.sort_values(["community_district", "month"])
              .groupby("community_district")
              .tail(1)
        )

    df = df.sort_values(metric, ascending=ascending)

    cols = ["community_district", "name", "month", metric, "nsqi_grade"]
    cols = [c for c in cols if c in df.columns]

    return df.head(top_n)[cols].to_dict(orient="records")


# ----------------------------------------------------------
# FastAPI Route
# ----------------------------------------------------------

@router.post("/ask_agent")
def ask_agent(query: AgentQuery):
    if MODEL_BUNDLE is None or CITYWIDE_DF is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")

    structured = interpret_with_llm(query.question)

    try:
        results = answer_question(structured)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "structured_query": structured,
        "results": results,
        "count": len(results),
    }
