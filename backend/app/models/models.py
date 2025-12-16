# Fastapi Imports
from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    # email = Column(String)
    username = Column(String)
    password = Column(String)
    signin_method = Column(String)


class SurveyResponse(Base):
    """Survey responses table for storing neighborhood feedback"""

    __tablename__ = "survey_responses"

    # Primary key and metadata
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Step 1: Personal Information
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    age = Column(Integer, nullable=False)
    borough = Column(String, nullable=False, index=True)  # Indexed for analytics
    neighborhood = Column(String, nullable=False, index=True)  # Indexed for analytics
    zip_code = Column(String(5), nullable=False, index=True)
    residency_duration = Column(String, nullable=False)

    # Step 2: Safety & Security
    safety_rating = Column(Integer, nullable=False)
    time_of_day_safety = Column(String, nullable=False)
    crime_concern_level = Column(String, nullable=False)
    police_presence_rating = Column(Integer, nullable=False)
    safety_testimonial = Column(Text, nullable=True)

    # Step 3: Cleanliness & Environment
    street_cleanliness_rating = Column(Integer, nullable=False)
    trash_management_rating = Column(Integer, nullable=False)
    parks_quality_rating = Column(Integer, nullable=False)
    noise_level = Column(String, nullable=False)
    environmental_testimonial = Column(Text, nullable=True)

    # Step 4: Food & Amenities
    grocery_store_access = Column(String, nullable=False)
    restaurant_variety_rating = Column(Integer, nullable=False)
    food_affordability_rating = Column(Integer, nullable=False)
    farmers_market_access = Column(Boolean, nullable=False)
    food_access_testimonial = Column(Text, nullable=True)

    # Step 5: Financials & Living Costs
    rent_affordability = Column(String, nullable=False)
    cost_of_living = Column(String, nullable=False)
    value_for_money_rating = Column(Integer, nullable=False)
    financial_testimonial = Column(Text, nullable=True)

    # Step 6: Overall Feedback
    overall_rating = Column(Integer, nullable=False)
    would_recommend = Column(Boolean, nullable=False)
    biggest_strength = Column(Text, nullable=False)
    area_for_improvement = Column(Text, nullable=False)
    additional_comments = Column(Text, nullable=True)
