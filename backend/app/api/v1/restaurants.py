from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.restaurant import RestaurantOut, RestaurantUpdate

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/me", response_model=RestaurantOut)
async def get_my_restaurant(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> RestaurantOut:
    """Admin only. Returns the current user's restaurant details."""
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == current_user.restaurant_id)
    )
    restaurant: Restaurant | None = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )
    return RestaurantOut.model_validate(restaurant)


@router.put("/me", response_model=RestaurantOut)
async def update_my_restaurant(
    body: RestaurantUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> RestaurantOut:
    """Admin only. Update the current user's restaurant name, address, or logo URL."""
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == current_user.restaurant_id)
    )
    restaurant: Restaurant | None = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(restaurant, field, value)

    await db.flush()
    await db.refresh(restaurant)
    return RestaurantOut.model_validate(restaurant)
