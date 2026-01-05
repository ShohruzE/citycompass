import json
from pathlib import Path
from typing import Optional

from langchain.tools import tool
from langgraph.config import get_stream_writer

from app.model_loader import predict_nsqi_for_district
from app.api.acs import _fetch_acs_zcta


# Load ZIP to district mapping
DATA_DIR = Path(__file__).parent.parent / "data"
with open(DATA_DIR / "nyc_zip_to_district.json") as f:
    ZIP_TO_DISTRICT: dict[str, str] = json.load(f)


# Borough code mapping for display
BOROUGH_CODES = {
    "MN": "Manhattan",
    "BK": "Brooklyn",
    "QN": "Queens",
    "BX": "Bronx",
    "SI": "Staten Island",
}


def _get_borough_from_district(district: str) -> str:
    """Extract borough name from district code like 'BK15' -> 'Brooklyn'."""
    prefix = district[:2]
    return BOROUGH_CODES.get(prefix, "Unknown")


def _zip_to_district(zip_code: str) -> Optional[str]:
    """Convert a ZIP code to its community district code."""
    return ZIP_TO_DISTRICT.get(zip_code)


@tool
def get_nsqi_prediction(zip_code: str) -> str:
    """
    Get the Neighborhood Social Quality Index (NSQI) prediction for an NYC ZIP code.

    The NSQI is a 0-100 score measuring neighborhood quality based on factors like
    safety, cleanliness, amenities, and economic indicators. Higher scores are better.
    Also returns a letter grade (A-F) and percentile ranking.

    Args:
        zip_code: A 5-digit NYC ZIP code (e.g., "10001", "11211")

    Returns:
        A summary of the NSQI score, grade, and percentile for the neighborhood.
    """
    writer = get_stream_writer()
    writer(f"Looking up NSQI for ZIP code {zip_code}...")

    # Map ZIP to community district
    district = _zip_to_district(zip_code)
    if not district:
        return (
            f"ZIP code {zip_code} is not a valid NYC ZIP code or not in our database."
        )

    borough = _get_borough_from_district(district)
    writer(f"Found community district {district} in {borough}")

    try:
        result = predict_nsqi_for_district(district)
        writer(f"Retrieved NSQI data successfully")

        return (
            f"NSQI Results for ZIP {zip_code} ({borough}, District {district}):\n"
            f"- Score: {result['percentile']:.1f}/100\n"
            f"- Grade: {result['grade']}\n"
            f"- Raw prediction score: {result['predicted_score']:.3f}\n"
            f"- Community District: {result['community_district']}"
        )
    except ValueError as e:
        return f"Could not find NSQI data for ZIP {zip_code} (district {district}): {str(e)}"
    except Exception as e:
        return f"Error retrieving NSQI for ZIP {zip_code}: {str(e)}"


@tool
def get_acs_demographics(zip_code: str) -> str:
    """
    Get demographic data from the American Community Survey (ACS) for an NYC ZIP code.

    Returns population, median household income, median age, and poverty rate
    from the US Census Bureau's American Community Survey.

    Args:
        zip_code: A 5-digit ZIP code (e.g., "10001", "11211")

    Returns:
        A summary of demographic statistics for the ZIP code area.
    """
    writer = get_stream_writer()
    writer(f"Fetching ACS demographic data for ZIP {zip_code}...")

    try:
        data = _fetch_acs_zcta(zip_code)
        writer(f"Retrieved census data successfully")

        # Format the results
        population = (
            f"{int(data['total_population']):,}"
            if data.get("total_population")
            else "N/A"
        )
        income = (
            f"${int(data['median_household_income']):,}"
            if data.get("median_household_income")
            else "N/A"
        )
        age = f"{data['median_age']:.1f} years" if data.get("median_age") else "N/A"
        poverty = (
            f"{data['poverty_rate'] * 100:.1f}%"
            if data.get("poverty_rate") is not None
            else "N/A"
        )

        return (
            f"ACS Demographics for ZIP {zip_code}:\n"
            f"- Total Population: {population}\n"
            f"- Median Household Income: {income}\n"
            f"- Median Age: {age}\n"
            f"- Poverty Rate: {poverty}"
        )
    except Exception as e:
        return f"Error retrieving ACS data for ZIP {zip_code}: {str(e)}"


@tool
def compare_neighborhoods(zip_code_a: str, zip_code_b: str) -> str:
    """
    Compare two NYC neighborhoods side by side using NSQI scores and ACS demographics.

    Provides a comprehensive comparison including quality scores, demographics,
    and highlights which neighborhood is better in each category.

    Args:
        zip_code_a: First 5-digit NYC ZIP code to compare
        zip_code_b: Second 5-digit NYC ZIP code to compare

    Returns:
        A side-by-side comparison of both neighborhoods with key metrics.
    """
    writer = get_stream_writer()
    writer(f"Comparing neighborhoods: {zip_code_a} vs {zip_code_b}...")

    results = {"a": {}, "b": {}}

    # Get NSQI for both
    for label, zip_code in [("a", zip_code_a), ("b", zip_code_b)]:
        district = _zip_to_district(zip_code)
        if district:
            try:
                nsqi = predict_nsqi_for_district(district)
                results[label]["nsqi"] = nsqi
                results[label]["borough"] = _get_borough_from_district(district)
                results[label]["district"] = district
            except Exception:
                results[label]["nsqi"] = None
        else:
            results[label]["nsqi"] = None
            results[label]["error"] = "Not a valid NYC ZIP"

    writer(f"Retrieved NSQI scores")

    # Get ACS for both
    for label, zip_code in [("a", zip_code_a), ("b", zip_code_b)]:
        try:
            acs = _fetch_acs_zcta(zip_code)
            results[label]["acs"] = acs
        except Exception:
            results[label]["acs"] = None

    writer(f"Retrieved demographic data")

    # Build comparison output
    output = [f"Comparison: {zip_code_a} vs {zip_code_b}\n", "=" * 50]

    # NSQI Comparison
    output.append("\n📊 NSQI Quality Score:")
    for label, zip_code in [("a", zip_code_a), ("b", zip_code_b)]:
        if results[label].get("nsqi"):
            nsqi = results[label]["nsqi"]
            borough = results[label].get("borough", "Unknown")
            output.append(
                f"  {zip_code} ({borough}): {nsqi['percentile']:.1f}/100 (Grade {nsqi['grade']})"
            )
        else:
            output.append(f"  {zip_code}: Data unavailable")

    # Determine NSQI winner
    nsqi_a = results["a"].get("nsqi", {}).get("percentile")
    nsqi_b = results["b"].get("nsqi", {}).get("percentile")
    if nsqi_a and nsqi_b:
        if nsqi_a > nsqi_b:
            output.append(f"  → {zip_code_a} has a higher quality score")
        elif nsqi_b > nsqi_a:
            output.append(f"  → {zip_code_b} has a higher quality score")
        else:
            output.append(f"  → Both have similar quality scores")

    # Demographics Comparison
    output.append("\n👥 Demographics:")

    # Income
    output.append("  Median Income:")
    for label, zip_code in [("a", zip_code_a), ("b", zip_code_b)]:
        acs = results[label].get("acs")
        if acs and acs.get("median_household_income"):
            output.append(f"    {zip_code}: ${int(acs['median_household_income']):,}")
        else:
            output.append(f"    {zip_code}: N/A")

    # Population
    output.append("  Population:")
    for label, zip_code in [("a", zip_code_a), ("b", zip_code_b)]:
        acs = results[label].get("acs")
        if acs and acs.get("total_population"):
            output.append(f"    {zip_code}: {int(acs['total_population']):,}")
        else:
            output.append(f"    {zip_code}: N/A")

    # Poverty Rate
    output.append("  Poverty Rate:")
    for label, zip_code in [("a", zip_code_a), ("b", zip_code_b)]:
        acs = results[label].get("acs")
        if acs and acs.get("poverty_rate") is not None:
            output.append(f"    {zip_code}: {acs['poverty_rate'] * 100:.1f}%")
        else:
            output.append(f"    {zip_code}: N/A")

    return "\n".join(output)


@tool
def search_neighborhoods(
    borough: Optional[str] = None,
    min_nsqi_score: Optional[float] = None,
    max_poverty_rate: Optional[float] = None,
    min_income: Optional[float] = None,
) -> str:
    """
    Search for NYC neighborhoods matching specific criteria.

    Filter neighborhoods by borough, minimum quality score, maximum poverty rate,
    or minimum median income. Returns up to 5 matching neighborhoods.

    Args:
        borough: Filter by borough name (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
        min_nsqi_score: Minimum NSQI quality score (0-100)
        max_poverty_rate: Maximum poverty rate as decimal (e.g., 0.15 for 15%)
        min_income: Minimum median household income in dollars

    Returns:
        A list of neighborhoods matching the criteria with their key stats.
    """
    writer = get_stream_writer()

    criteria = []
    if borough:
        criteria.append(f"borough={borough}")
    if min_nsqi_score:
        criteria.append(f"min_score={min_nsqi_score}")
    if max_poverty_rate:
        criteria.append(f"max_poverty={max_poverty_rate * 100:.0f}%")
    if min_income:
        criteria.append(f"min_income=${min_income:,.0f}")

    writer(
        f"Searching neighborhoods with criteria: {', '.join(criteria) if criteria else 'none'}"
    )

    # Map borough name to code
    borough_code = None
    if borough:
        borough_lower = borough.lower()
        for code, name in BOROUGH_CODES.items():
            if name.lower() == borough_lower:
                borough_code = code
                break

    matches = []
    checked = 0

    # Check each ZIP code
    for zip_code, district in ZIP_TO_DISTRICT.items():
        # Filter by borough if specified
        if borough_code and not district.startswith(borough_code):
            continue

        checked += 1
        if checked % 20 == 0:
            writer(f"Checked {checked} neighborhoods...")

        try:
            # Get NSQI
            nsqi_data = predict_nsqi_for_district(district)
            nsqi_score = nsqi_data.get("percentile", 0)

            # Filter by NSQI
            if min_nsqi_score and nsqi_score < min_nsqi_score:
                continue

            # Get ACS data
            try:
                acs_data = _fetch_acs_zcta(zip_code)
                poverty = acs_data.get("poverty_rate")
                income = acs_data.get("median_household_income")

                # Filter by poverty rate
                if (
                    max_poverty_rate
                    and poverty is not None
                    and poverty > max_poverty_rate
                ):
                    continue

                # Filter by income
                if min_income and income is not None and income < min_income:
                    continue

            except Exception:
                acs_data = {}
                poverty = None
                income = None

            # This neighborhood matches!
            matches.append(
                {
                    "zip": zip_code,
                    "district": district,
                    "borough": _get_borough_from_district(district),
                    "nsqi_score": nsqi_score,
                    "grade": nsqi_data.get("grade", "?"),
                    "income": income,
                    "poverty": poverty,
                }
            )

            # Limit results
            if len(matches) >= 5:
                break

        except Exception:
            continue

    writer(f"Found {len(matches)} matching neighborhoods")

    if not matches:
        return (
            "No neighborhoods found matching your criteria. Try relaxing some filters."
        )

    # Sort by NSQI score descending
    matches.sort(key=lambda x: x["nsqi_score"], reverse=True)

    # Format output
    output = [f"Found {len(matches)} neighborhood(s) matching your criteria:\n"]

    for i, m in enumerate(matches, 1):
        output.append(
            f"{i}. ZIP {m['zip']} - {m['borough']} (District {m['district']})"
        )
        output.append(f"   NSQI: {m['nsqi_score']:.1f}/100 (Grade {m['grade']})")
        if m["income"]:
            output.append(f"   Median Income: ${int(m['income']):,}")
        if m["poverty"] is not None:
            output.append(f"   Poverty Rate: {m['poverty'] * 100:.1f}%")
        output.append("")

    return "\n".join(output)


# Export all tools as a list for easy import
AGENT_TOOLS = [
    get_nsqi_prediction,
    get_acs_demographics,
    compare_neighborhoods,
    search_neighborhoods,
]
