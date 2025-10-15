from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create database engine
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=settings.DEBUG
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    # Fallback: create a dummy engine for development
    engine = None

# Create session factory
if engine:
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    SessionLocal = None

# Create base class for models
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    if not SessionLocal:
        logger.warning("Database connection not available, using fallback")
        # Return a mock session for development
        class MockSession:
            def add(self, obj): pass
            def commit(self): pass
            def refresh(self, obj): pass
            def rollback(self): pass
            def close(self): pass
            def query(self, model): 
                class MockQuery:
                    def count(self): return 0
                    def filter(self, *args): return self
                    def first(self): return None
                    def all(self): return []
                return MockQuery()
        return MockSession()
    
    try:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Database connection failed, using fallback: {e}")
        # Return a mock session when database connection fails
        class MockSession:
            def add(self, obj): pass
            def commit(self): pass
            def refresh(self, obj): pass
            def rollback(self): pass
            def close(self): pass
            def query(self, model): 
                class MockQuery:
                    def count(self): return 0
                    def filter(self, *args): return self
                    def first(self): return None
                    def all(self): return []
                return MockQuery()
        return MockSession()
