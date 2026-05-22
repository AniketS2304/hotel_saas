from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.auth.dependencies import require_role
from app.auth.utils import get_password_hash
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserOut
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

router = APIRouter(prefix="/staff", tags=["Staff"])


class StaffCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(default="waiter", pattern="^(waiter)$")


class StaffUpdate(BaseModel):
    is_active: Optional[bool] = None


@router.get("", response_model=list[UserOut])
async def list_staff(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[UserOut]:
    """Admin only. Returns all staff (non-admin) for this restaurant."""
    result = await db.execute(
        select(User).where(
            User.restaurant_id == current_user.restaurant_id,
            User.role != "admin",
        )
    )
    staff = result.scalars().all()
    return [UserOut.model_validate(u) for u in staff]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_staff(
    body: StaffCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    """Admin only. Create a new staff member (waiter) for this restaurant."""
    # Check email is not already taken
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        id=uuid.uuid4(),
        restaurant_id=current_user.restaurant_id,
        name=body.name,
        email=body.email,
        password_hash=get_password_hash(body.password),
        role=body.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.patch("/{user_id}", response_model=UserOut)
async def update_staff(
    user_id: uuid.UUID,
    body: StaffUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    """Admin only. Activate or deactivate a staff member."""
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.restaurant_id == current_user.restaurant_id,
            User.role != "admin",  # can't modify another admin
        )
    )
    user: User | None = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")

    if body.is_active is not None:
        user.is_active = body.is_active

    await db.flush()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff(
    user_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Admin only. Permanently delete a staff member."""
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.restaurant_id == current_user.restaurant_id,
            User.role != "admin",
        )
    )
    user: User | None = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")

    await db.delete(user)
