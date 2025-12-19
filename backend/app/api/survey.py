from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Annotated
from pydantic import ValidationError
from fastapi.encoders import jsonable_encoder

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
        # The email is stored under 'username' key in the JWT token
        user_email = current_user.get("username") or current_user.get("email")
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
            email=user_email,
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

        return SurveyResponse(
            id=db_survey.id,
            user_email=db_survey.user_email,
            name=db_survey.name,
            age=db_survey.age,
            borough=db_survey.borough,
            neighborhood=db_survey.neighborhood,
            zip_code=db_survey.zip_code,
            residency_duration=db_survey.residency_duration,
            safety_rating=db_survey.safety_rating,
            time_of_day_safety=db_survey.time_of_day_safety,
            crime_concern_level=db_survey.crime_concern_level,
            police_presence_rating=db_survey.police_presence_rating,
            safety_testimonial=db_survey.safety_testimonial,
            street_cleanliness_rating=db_survey.street_cleanliness_rating,
            trash_management_rating=db_survey.trash_management_rating,
            parks_quality_rating=db_survey.parks_quality_rating,
            noise_level=db_survey.noise_level,
            environmental_testimonial=db_survey.environmental_testimonial,
            grocery_store_access=db_survey.grocery_store_access,
            restaurant_variety_rating=db_survey.restaurant_variety_rating,
            food_affordability_rating=db_survey.food_affordability_rating,
            farmers_market_access=db_survey.farmers_market_access,
            food_access_testimonial=db_survey.food_access_testimonial,
            rent_affordability=db_survey.rent_affordability,
            cost_of_living=db_survey.cost_of_living,
            value_for_money_rating=db_survey.value_for_money_rating,
            financial_testimonial=db_survey.financial_testimonial,
            overall_rating=db_survey.overall_rating,
            would_recommend=db_survey.would_recommend,
            biggest_strength=db_survey.biggest_strength,
            area_for_improvement=db_survey.area_for_improvement,
            additional_comments=db_survey.additional_comments,
            created_at=db_survey.created_at.isoformat(),
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
) -> list[dict]:
    """
    Get all survey submissions for the authenticated user with full details.

    **Authentication Required**: User must be logged in via OAuth.

    **Returns**: List of all surveys submitted by the user with complete response data.
    """

    try:
        # The email is stored under 'username' key in the JWT token
        user_email = current_user.get("username") or current_user.get("email")
        if not user_email:
            logger.error(f"User session missing email: {current_user}")
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
                user_email=user_email,
                name=survey.name,
                age=survey.age,
                borough=survey.borough,
                neighborhood=survey.neighborhood,
                zip_code=survey.zip_code,
                residency_duration=survey.residency_duration,
                safety_rating=survey.safety_rating,
                time_of_day_safety=survey.time_of_day_safety,
                crime_concern_level=survey.crime_concern_level,
                police_presence_rating=survey.police_presence_rating,
                safety_testimonial=survey.safety_testimonial,
                street_cleanliness_rating=survey.street_cleanliness_rating,
                trash_management_rating=survey.trash_management_rating,
                parks_quality_rating=survey.parks_quality_rating,
                noise_level=survey.noise_level,
                environmental_testimonial=survey.environmental_testimonial,
                grocery_store_access=survey.grocery_store_access,
                restaurant_variety_rating=survey.restaurant_variety_rating,
                food_affordability_rating=survey.food_affordability_rating,
                farmers_market_access=survey.farmers_market_access,
                food_access_testimonial=survey.food_access_testimonial,
                rent_affordability=survey.rent_affordability,
                cost_of_living=survey.cost_of_living,
                value_for_money_rating=survey.value_for_money_rating,
                financial_testimonial=survey.financial_testimonial,
                overall_rating=survey.overall_rating,
                would_recommend=survey.would_recommend,
                biggest_strength=survey.biggest_strength,
                area_for_improvement=survey.area_for_improvement,
                additional_comments=survey.additional_comments,
                created_at=survey.created_at.isoformat(),  # ensure JSON-serializable
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
    "/current-location",
    responses={
        200: {"description": "User's current location from latest survey"},
        401: {"model": ErrorResponse, "description": "Not authenticated"},
    },
)
async def get_current_location(
    db: db_dependency,
    current_user: user_dependency,
):
    """
    Get the user's current location (zip code) from their latest survey response.

    **Authentication Required**: User must be logged in via OAuth.

    **Returns**: Location data with zip_code, borough, neighborhood, and created_at, or null if no survey exists.
    """

    try:
        # The email is stored under 'username' key in the JWT token
        user_email = current_user.get("username") or current_user.get("email")
        if not user_email:
            logger.error(f"User session missing email: {current_user}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User email not found in session.",
            )

        # Query user's latest survey
        latest_survey = (
            db.query(SurveyResponseModel)
            .filter(SurveyResponseModel.user_email == user_email)
            .order_by(SurveyResponseModel.created_at.desc())
            .first()
        )

        if not latest_survey:
            return {
                "zip_code": None,
                "borough": None,
                "neighborhood": None,
                "created_at": None,
            }

        logger.info(
            f"Retrieved current location for user: {user_email}, ZIP: {latest_survey.zip_code}"
        )

        return {
            "zip_code": latest_survey.zip_code,
            "borough": latest_survey.borough,
            "neighborhood": latest_survey.neighborhood,
            "created_at": latest_survey.created_at,
        }

    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving current location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve location. Please try again later.",
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
                    "average_rating": round(float(stat.avg_rating), 2)
                    if stat.avg_rating
                    else None,
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
