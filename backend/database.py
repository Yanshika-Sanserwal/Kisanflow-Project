
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Read the database URL configured in the environment
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Support older PostgreSQL URL formats
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace(
            "postgres://", "postgresql://", 1
        )

    # Connect to PostgreSQL on Render
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True
    )

else:
    # Use SQLite when running locally
    DATABASE_URL = "sqlite:///./kisanflow.db"

    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
