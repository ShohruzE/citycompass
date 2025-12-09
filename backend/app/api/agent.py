# backend/app/api/agent.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import json
import re

from google import genai
client = genai.Client()  # picks up GEMINI_API_KEY automatically

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
# Metric mapping
# ----------------------------------------------------------

metric_map: Dict[str, tuple[str, bool]] = {
    # SAFETY
    "safest": ("serious_crime_rate_per_1_000_residents", True),
    "safe": ("serious_crime_rate_per_1_000_residents", True),
    "crime": ("serious_crime_rate_per_1_000_residents", True),
    "violent crime": ("serious_crime_rate_violent_per_1_000_residents", True),
    "property crime": ("serious_crime_rate_property_per_1_000_residents", True),

    # CLEANLINESS
    "cleanest": ("total_housing_code_violations_per_1_000_privately_owned_rental_units", True),
    "clean": ("total_housing_code_violations_per_1_000_privately_owned_rental_units", True),
    "housing violations": ("serious_housing_code_violations_per_1_000_privately_owned_rental_units", True),
    "code violations": ("total_housing_code_violations_per_1_000_privately_owned_rental_units", True),

    # AFFORDABILITY
    "cheapest": ("median_rent_all_2024usd", True),
    "cheap": ("median_rent_all_2024usd", True),
    "affordable": ("median_rent_all_2024usd", True),
    "expensive": ("median_rent_all_2024usd", False),
    "rent": ("median_rent_all_2024usd", True),

    # ECONOMIC STATUS
    "richest": ("median_household_income_2024usd", False),
    "wealthiest": ("median_household_income_2024usd", False),
    "poorest": ("median_household_income_2024usd", True),

    # EDUCATION
    "best schools": ("students_performing_at_grade_level_in_math_4th_grade", False),

    # HOUSING SUPPLY
    "new housing": ("units_authorized_by_new_residential_building_permits", False),

    # DIVERSITY
    "diverse": ("racial_diversity_index", False),

    # POPULATION
    "densest": ("population_density_1_000_persons_per_square_mile", False),

    # FORECLOSURE
    "foreclosure": ("notices_of_foreclosure_rate_per_1_000_1_4_family_and_condo_properties", True),

    # COMMUTE
    "commute": ("mean_travel_time_to_work_minutes", True),

    # RENT BURDEN
    "rent burden": ("severely_rent_burdened_households", True),

    # HOME PRICES
    "home price": ("median_sales_price_per_unit_1_family_building_2024usd", False),

    # DEVELOPMENT ACTIVITY
    "sales volume": ("sales_volume_all_property_types", False),

    # NSQI default
    "quality": ("nsqi_index", False),
    "best neighborhoods": ("nsqi_index", False),
    "worst neighborhoods": ("nsqi_index", True),
}


# ----------------------------------------------------------
# Helper functions
# ----------------------------------------------------------

NUM_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
}


def infer_borough_from_text(question: str) -> Optional[str]:
    upper = question.upper().replace(",", " ").replace(".", " ")
    for key, borough in BOROUGH_KEYWORDS.items():
        if key in upper:
            return borough
    return None


def infer_metric_from_text(question: str) -> tuple[str, bool]:
    text = question.lower()
    for key, (metric, ascending) in metric_map.items():
        if key in text:
            return metric, ascending
    return "nsqi_index", False


def infer_intent_from_text(question: str) -> str:
    q = question.lower()
    if any(word in q for word in ["best", "top", "safest", "cleanest"]):
        return "top"
    if any(word in q for word in ["worst", "most dangerous", "dirtiest"]):
        return "bottom"
    return "generic"


def infer_top_n_from_text(question: str) -> int:
    q = question.lower()

    nums = re.findall(r"\b\d+\b", q)
    if nums:
        return int(nums[0])

    for word, value in NUM_WORDS.items():
        if word in q:
            return value

    if "neighborhoods" in q or "top" in q:
        return 5

    if "neighborhood" in q:
        return 1

    return 5


# ----------------------------------------------------------
# NEW LLM Interpreter (Gemini)
# ----------------------------------------------------------

def interpret_with_llm(question: str) -> Dict[str, Any]:
    """
    1. Ask Gemini to extract borough/metric/intent/top_n as JSON.
    2. Safely parse JSON.
    3. Override/augment with robust heuristic mapping.
    """

    base_struct: Dict[str, Any] = {}

    # ---- Gemini prompt ----
    prompt = f"""
You are an expert structured parser for questions about NYC neighborhoods.

Question: "{question}"

Respond with ONLY a JSON object, no explanation, no backticks.
Follow this schema exactly:

{{
  "borough": "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island" | null,
  "intent": "top" | "bottom" | "trend" | "generic",
  "top_n": number,
  "metric": string
}}
"""

    # ----------------------------------------------------------
    # STEP 1 — Try Gemini
    # ----------------------------------------------------------
    try:
        from app.api.gemini_client import call_gemini

        raw = call_gemini(prompt)  # This should be a string

        # Try to extract JSON substring between first { and last }
        if isinstance(raw, str) and "{" in raw and "}" in raw:
            json_str = raw[raw.index("{"): raw.rindex("}") + 1]
        else:
            json_str = raw

        parsed = json.loads(json_str)

        if isinstance(parsed, dict):
            base_struct = parsed

    except Exception as e:
        print(f"⚠️ Gemini interpretation failed: {e}")
        base_struct = {}

    # ----------------------------------------------------------
    # STEP 2 — Apply heuristic fallbacks / overrides
    # ----------------------------------------------------------

    # Borough
    borough = base_struct.get("borough")
    if not borough:
        borough = infer_borough_from_text(question)

    # Metric + sort direction
    metric, ascending = infer_metric_from_text(question)

    # Intent
    intent = base_struct.get("intent") or infer_intent_from_text(question)

    # Top N
    top_n = base_struct.get("top_n")
    if top_n is None:
        top_n = infer_top_n_from_text(question)

    try:
        top_n = int(top_n)
    except Exception:
        top_n = 5

    # ----------------------------------------------------------
    # STEP 3 — Final structure
    # ----------------------------------------------------------

    structured = {
        "borough": borough,
        "intent": intent,
        "top_n": top_n,
        "metric": metric,
        "ascending": ascending,
    }

    return structured


# ----------------------------------------------------------
# Core agent logic remains unchanged
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

    if borough:
        prefix = BOROUGH_PREFIX.get(borough)
        if prefix and "community_district" in df.columns:
            df = df[df["community_district"].str.startswith(prefix)]
        if df.empty:
            print(f"⚠️ No rows for borough={borough}, falling back to all NYC")
            df = CITYWIDE_DF.copy()

    if ascending is None:
        ascending = (intent == "bottom")

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

from app.api.gemini_client import summarize_results

@router.post("/ask_agent")
def ask_agent(query: AgentQuery):
    if MODEL_BUNDLE is None or CITYWIDE_DF is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")

    structured = interpret_with_llm(query.question)

    try:
        results = answer_question(structured)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # NEW: Gemini conversational summary
    answer = summarize_results(query.question, results)

    return {
        "answer": answer,
        "results": results,
        "structured_query": structured,
        "count": len(results),
    }
