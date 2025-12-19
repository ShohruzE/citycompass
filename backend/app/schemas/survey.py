from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
import re


# Enums as Literal types for strict validation
BoroughType = Literal["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
ResidencyDurationType = Literal["< 6 months", "6-12 months", "1-3 years", "3-5 years", "5+ years"]
TimeOfDaySafetyType = Literal["Day only", "Night only", "Both", "Neither"]
CrimeConcernType = Literal["Not concerned", "Slightly concerned", "Moderately concerned", "Very concerned"]
NoiseLevelType = Literal["Very quiet", "Quiet", "Moderate", "Loud", "Very loud"]
GroceryAccessType = Literal["Walk < 5min", "Walk 5-15min", "Walk 15-30min", "Drive required", "No access"]
AffordabilityType = Literal["Very affordable", "Affordable", "Fair", "Expensive", "Very expensive"]
CostOfLivingType = Literal["Very low", "Low", "Moderate", "High", "Very high"]


class SurveyRequest(BaseModel):
    """Survey request schema with full validation matching frontend"""
    
    # Step 1: Personal Information
    name: str = Field(..., min_length=2, description="Full name of the respondent")
    age: int = Field(..., ge=18, le=100, description="Age must be between 18 and 100")
    borough: BoroughType = Field(..., description="NYC Borough")
    neighborhood: str = Field(..., min_length=2, description="Neighborhood name")
    zipCode: str = Field(..., description="5-digit zip code")
    residencyDuration: ResidencyDurationType = Field(..., description="How long lived in neighborhood")
    
    # Step 2: Safety & Security
    safetyRating: int = Field(..., ge=1, le=5, description="Overall safety rating 1-5")
    timeOfDaySafety: TimeOfDaySafetyType = Field(..., description="When they feel safe")
    crimeConcernLevel: CrimeConcernType = Field(..., description="Level of crime concern")
    policePresenceRating: int = Field(..., ge=1, le=5, description="Police presence rating 1-5")
    safetyTestimonial: Optional[str] = Field(None, description="Optional safety testimonial")
    
    # Step 3: Cleanliness & Environment
    streetCleanlinessRating: int = Field(..., ge=1, le=5, description="Street cleanliness rating 1-5")
    trashManagementRating: int = Field(..., ge=1, le=5, description="Trash management rating 1-5")
    parksQualityRating: int = Field(..., ge=1, le=5, description="Parks quality rating 1-5")
    noiseLevel: NoiseLevelType = Field(..., description="Neighborhood noise level")
    environmentalTestimonial: Optional[str] = Field(None, description="Optional environmental testimonial")
    
    # Step 4: Food & Amenities
    groceryStoreAccess: GroceryAccessType = Field(..., description="Grocery store accessibility")
    restaurantVarietyRating: int = Field(..., ge=1, le=5, description="Restaurant variety rating 1-5")
    foodAffordabilityRating: int = Field(..., ge=1, le=5, description="Food affordability rating 1-5")
    farmersMarketAccess: bool = Field(..., description="Access to farmers market")
    foodAccessTestimonial: Optional[str] = Field(None, description="Optional food access testimonial")
    
    # Step 5: Financials & Living Costs
    rentAffordability: AffordabilityType = Field(..., description="Rent/mortgage affordability")
    costOfLiving: CostOfLivingType = Field(..., description="Overall cost of living")
    valueForMoneyRating: int = Field(..., ge=1, le=5, description="Value for money rating 1-5")
    financialTestimonial: Optional[str] = Field(None, description="Optional financial testimonial")
    
    # Step 6: Overall Feedback
    overallRating: int = Field(..., ge=1, le=5, description="Overall neighborhood rating 1-5")
    wouldRecommend: bool = Field(..., description="Would recommend to others")
    biggestStrength: str = Field(..., min_length=10, description="Biggest neighborhood strength")
    areaForImprovement: str = Field(..., min_length=10, description="Area needing improvement")
    additionalComments: Optional[str] = Field(None, description="Optional additional comments")
    
    @field_validator('zipCode')
    @classmethod
    def validate_zip_code(cls, v: str) -> str:
        """Validate zip code is 5 digits"""
        if not re.match(r'^\d{5}$', v):
            raise ValueError('Zip code must be exactly 5 digits')
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "John Doe",
                "age": 30,
                "borough": "Brooklyn",
                "neighborhood": "Williamsburg",
                "zipCode": "11211",
                "residencyDuration": "1-3 years",
                "safetyRating": 4,
                "timeOfDaySafety": "Both",
                "crimeConcernLevel": "Slightly concerned",
                "policePresenceRating": 4,
                "safetyTestimonial": "Feel safe walking at night",
                "streetCleanlinessRating": 3,
                "trashManagementRating": 3,
                "parksQualityRating": 4,
                "noiseLevel": "Moderate",
                "environmentalTestimonial": "Parks are well maintained",
                "groceryStoreAccess": "Walk < 5min",
                "restaurantVarietyRating": 5,
                "foodAffordabilityRating": 3,
                "farmersMarketAccess": True,
                "foodAccessTestimonial": "Great food options",
                "rentAffordability": "Expensive",
                "costOfLiving": "High",
                "valueForMoneyRating": 3,
                "financialTestimonial": "Worth the cost for the location",
                "overallRating": 4,
                "wouldRecommend": True,
                "biggestStrength": "Amazing restaurants and nightlife",
                "areaForImprovement": "More affordable housing options needed",
                "additionalComments": "Love living here overall"
            }
        }
    }


class SurveyResponse(BaseModel):
    """Survey response schema"""
    id: int
    user_email: str
    name: str
    age: int
    borough: str
    neighborhood: str
    zip_code: str
    residency_duration: str
    safety_rating: int
    time_of_day_safety: str
    crime_concern_level: str
    police_presence_rating: int
    safety_testimonial: str
    street_cleanliness_rating: int
    trash_management_rating: int
    parks_quality_rating: int
    noise_level: str
    environmental_testimonial: str
    grocery_store_access: str
    restaurant_variety_rating: int
    food_affordability_rating: int
    farmers_market_access: bool
    food_access_testimonial: str
    rent_affordability: str
    cost_of_living: str
    value_for_money_rating: int
    financial_testimonial: str
    overall_rating: int
    would_recommend: bool
    biggest_strength: str
    area_for_improvement: str
    additional_comments: str
    created_at: datetime
    message: str = "Survey submitted successfully"
    
    model_config = {
        "from_attributes": True
    }


class ErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    field_errors: Optional[dict] = None

