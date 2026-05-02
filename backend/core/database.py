from sqlmodel import create_engine, Session, SQLModel
from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
    pool_pre_ping=True,
)

def init_db():
    """Initialize database tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency for FastAPI to get database session"""
    with Session(engine) as session:
        yield session
