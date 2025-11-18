"""
Database table creation script.
Run this to create all tables defined in the models.

Usage:
    python -m app.create_tables
"""

from app.models.models import Base
from app.core.db import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_tables():
    """Create all database tables"""
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ All tables created successfully!")
        logger.info(f"Tables created: {', '.join(Base.metadata.tables.keys())}")
    except Exception as e:
        logger.error(f"❌ Error creating tables: {str(e)}")
        raise


if __name__ == "__main__":
    create_tables()

