# conftest.py (in your tests folder or project root)
import sys
import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.config import get_settings

# Add project root to path
project_root = Path(__file__).parent
# sys.path.insert(0, str(project_root))

from app.main import app  # Your FastAPI app
from app.schemas.db import get_db  # Adjust import path

# Use in-memory SQLite for testing
settings = get_settings()
DATABASE_URL = settings.database_url
# print(f"Using database URL: {DATABASE_URL}")
assert DATABASE_URL, "DATABASE_URL not set"


engine = create_engine(
    DATABASE_URL,
    poolclass=StaticPool,
    pool_pre_ping=True,  # Verify connections before use
    echo=False,  # Set to True for SQL query logging
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    """Create a fresh database for each test"""
    # Base.metadata.create_all(bind=engine)
    # db = TestingSessionLocal()
    # try:
    #     yield db
    # finally:
    #     db.close()
    #     Base.metadata.drop_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    """Create a test client with overridden database dependency"""
    # def override_get_db():
    #     try:
    #         yield db_session
    #     finally:
    #         pass
    
    # app.dependency_overrides[get_db] = override_get_db
    
    # with TestClient(app) as test_client:
    #     yield test_client
    
    # app.dependency_overrides.clear()
    return TestClient(app)