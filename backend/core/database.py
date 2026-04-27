from sqlmodel import create_engine, Session, SQLModel
from .config import settings

from sqlalchemy.pool import NullPool

engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,
    pool_pre_ping=True
)

def init_db():
    """Initialize database tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency for FastAPI to get database session"""
    with Session(engine) as session:
        yield session
