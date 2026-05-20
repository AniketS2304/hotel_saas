import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    subscription_plan: Mapped[str] = mapped_column(
        String(50), nullable=False, default="free"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        "User", back_populates="restaurant", cascade="all, delete-orphan"
    )
    tables: Mapped[list["Table"]] = relationship(  # noqa: F821
        "Table", back_populates="restaurant", cascade="all, delete-orphan"
    )
    menu_categories: Mapped[list["MenuCategory"]] = relationship(  # noqa: F821
        "MenuCategory", back_populates="restaurant", cascade="all, delete-orphan"
    )
    menu_items: Mapped[list["MenuItem"]] = relationship(  # noqa: F821
        "MenuItem", back_populates="restaurant", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship(  # noqa: F821
        "Order", back_populates="restaurant", cascade="all, delete-orphan"
    )
