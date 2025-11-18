from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Annotated
from pydantic import ValidationError

from app.core.db import get_db
from app.models.models import SurveyResponse as SurveyResponseModel
from app.schemas.survey import SurveyRequest, SurveyResponse, ErrorResponse
from app.api.auth import get_current_user

import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/survey", tags=["survey"])

# Type aliases for dependencies
db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]


@router.post(
    "",
    response_model=SurveyResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Survey submitted successfully"},
        400: {"model": ErrorResponse, "description": "Validation error"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def submit_survey(
    survey_data: SurveyRequest,
    db: db_dependency,
    current_user: user_dependency,
) -> SurveyResponse:
    """
    Submit a neighborhood survey response.
    
    **Authentication Required**: User must be logged in via OAuth.
    
    **Request Body**: Complete survey data with all required fields.
    
    **Returns**: Survey response with ID and confirmation message.
    
    **Errors**:
    - 400: Validation errors in survey data
    - 401: User not authenticated
    - 500: Database or server error
    """
    
    try:
        # Extract user email from session
        user_email = current_user.get("email")
        if not user_email:
            logger.error(f"User session missing email: {current_user}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User email not found in session. Please log in again.",
            )
        
        logger.info(f"Processing survey submission for user: {user_email}")
        
        # Create database model instance
        # Convert camelCase to snake_case for database
        db_survey = SurveyResponseModel(
            user_email=user_email,
            # Step 1: Personal Information
            name=survey_data.name,
            email=survey_data.email,
            age=survey_data.age,
            borough=survey_data.borough,
            neighborhood=survey_data.neighborhood,
            zip_code=survey_data.zipCode,
            residency_duration=survey_data.residencyDuration,
            # Step 2: Safety & Security
            safety_rating=survey_data.safetyRating,
            time_of_day_safety=survey_data.timeOfDaySafety,
            crime_concern_level=survey_data.crimeConcernLevel,
            police_presence_rating=survey_data.policePresenceRating,
            safety_testimonial=survey_data.safetyTestimonial,
            # Step 3: Cleanliness & Environment
            street_cleanliness_rating=survey_data.streetCleanlinessRating,
            trash_management_rating=survey_data.trashManagementRating,
            parks_quality_rating=survey_data.parksQualityRating,
            noise_level=survey_data.noiseLevel,
            environmental_testimonial=survey_data.environmentalTestimonial,
            # Step 4: Food & Amenities
            grocery_store_access=survey_data.groceryStoreAccess,
            restaurant_variety_rating=survey_data.restaurantVarietyRating,
            food_affordability_rating=survey_data.foodAffordabilityRating,
            farmers_market_access=survey_data.farmersMarketAccess,
            food_access_testimonial=survey_data.foodAccessTestimonial,
            # Step 5: Financials & Living Costs
            rent_affordability=survey_data.rentAffordability,
            cost_of_living=survey_data.costOfLiving,
            value_for_money_rating=survey_data.valueForMoneyRating,
            financial_testimonial=survey_data.financialTestimonial,
            # Step 6: Overall Feedback
            overall_rating=survey_data.overallRating,
            would_recommend=survey_data.wouldRecommend,
            biggest_strength=survey_data.biggestStrength,
            area_for_improvement=survey_data.areaForImprovement,
            additional_comments=survey_data.additionalComments,
        )
        
        # Add to database
        db.add(db_survey)
        db.commit()
        db.refresh(db_survey)
        
        logger.info(
            f"Survey submitted successfully. ID: {db_survey.id}, "
            f"User: {user_email}, Borough: {survey_data.borough}, "
            f"Neighborhood: {survey_data.neighborhood}"
        )
        
        # Return response
        return SurveyResponse(
            id=db_survey.id,
            user_email=user_email,
            borough=survey_data.borough,
            neighborhood=survey_data.neighborhood,
            created_at=db_survey.created_at,
            message="Survey submitted successfully! Thank you for your feedback.",
        )
        
    except ValidationError as e:
        # Pydantic validation errors (should be caught by FastAPI but just in case)
        logger.warning(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Validation error", "field_errors": e.errors()},
        )
        
    except SQLAlchemyError as e:
        # Database errors
        logger.error(f"Database error while submitting survey: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save survey response. Please try again later.",
        )
        
    except Exception as e:
        # Catch-all for unexpected errors
        logger.error(f"Unexpected error while submitting survey: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        )


@router.get(
    "/my-surveys",
    response_model=list[SurveyResponse],
    responses={
        200: {"description": "List of user's survey submissions"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def get_my_surveys(
    db: db_dependency,
    current_user: user_dependency,
) -> list[SurveyResponse]:
    """
    Get all survey submissions for the authenticated user.
    
    **Authentication Required**: User must be logged in via OAuth.
    
    **Returns**: List of all surveys submitted by the user.
    """
    
    try:
        user_email = current_user.get("email")
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User email not found in session.",
            )
        
        # Query user's surveys
        surveys = (
            db.query(SurveyResponseModel)
            .filter(SurveyResponseModel.user_email == user_email)
            .order_by(SurveyResponseModel.created_at.desc())
            .all()
        )
        
        logger.info(f"Retrieved {len(surveys)} surveys for user: {user_email}")
        
        return [
            SurveyResponse(
                id=survey.id,
                user_email=survey.user_email,
                borough=survey.borough,
                neighborhood=survey.neighborhood,
                created_at=survey.created_at,
                message="Survey response",
            )
            for survey in surveys
        ]
        
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving surveys: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve surveys. Please try again later.",
        )


@router.get(
    "/stats",
    responses={
        200: {"description": "Survey submission statistics"},
    },
)
async def get_survey_stats(db: db_dependency) -> dict:
    """
    Get general statistics about survey submissions.
    
    **No Authentication Required**: Public statistics.
    
    **Returns**: Overall survey statistics.
    """
    
    try:
        from sqlalchemy import func
        
        total_surveys = db.query(func.count(SurveyResponseModel.id)).scalar()
        
        borough_stats = (
            db.query(
                SurveyResponseModel.borough,
                func.count(SurveyResponseModel.id).label("count"),
                func.avg(SurveyResponseModel.overall_rating).label("avg_rating"),
            )
            .group_by(SurveyResponseModel.borough)
            .all()
        )
        
        return {
            "total_surveys": total_surveys,
            "borough_breakdown": [
                {
                    "borough": stat.borough,
                    "count": stat.count,
                    "average_rating": round(float(stat.avg_rating), 2) if stat.avg_rating else None,
                }
                for stat in borough_stats
            ],
        }
        
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics.",
        )

