from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator

from app.core.config import settings

# Render/Heroku provide DATABASE_URL as "postgres://" or "postgresql://"
# (psycopg2 sync driver). SQLAlchemy async requires "postgresql+asyncpg://".
# Rewrite the scheme here so the app works regardless of how the env var is set.
def _async_db_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

engine = create_async_engine(
    _async_db_url(settings.DATABASE_URL),
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize the database by creating all tables if they do not exist."""
    from app.db.base import Base
    from app.models.restaurant import Restaurant
    from app.models.user import User
    from app.models.table import Table
    from app.models.menu import MenuCategory, MenuItem
    from app.models.order import Order, OrderItem

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

