import io
import uuid

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.menu import MenuCategory, MenuItem
from app.models.restaurant import Restaurant
from app.models.table import Table
from app.models.user import User
from app.schemas.menu import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    CategoryWithItemsOut,
    MenuItemCreate,
    MenuItemOut,
    MenuItemUpdate,
    MenuItemWithCategoryOut,
)

router = APIRouter(tags=["Menu"])


def _item_to_dict(item: MenuItem) -> dict:
    """Safely serialize MenuItem scalars without triggering lazy relationship loads."""
    return {
        "id": item.id,
        "category_id": item.category_id,
        "restaurant_id": item.restaurant_id,
        "name": item.name,
        "description": item.description,
        "price": item.price,
        "image_url": item.image_url,
        "is_available": item.is_available,
        "is_veg": item.is_veg,
        "display_order": item.display_order,
    }


# ─── Public: Full menu for a restaurant ─────────────────────────────────────


@router.get("/menu/{restaurant_id}")
async def get_public_menu(
    restaurant_id: uuid.UUID,
    table_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    PUBLIC endpoint. Returns restaurant info + all categories with their
    available menu items for the given restaurant, ordered by display_order.
    """
    # Fetch restaurant name
    rest_result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = rest_result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    result = await db.execute(
        select(MenuCategory)
        .where(MenuCategory.restaurant_id == restaurant_id)
        .order_by(MenuCategory.display_order)
    )
    categories = result.scalars().all()

    output = []
    for cat in categories:
        items_result = await db.execute(
            select(MenuItem)
            .where(
                MenuItem.category_id == cat.id,
                MenuItem.is_available == True,  # noqa: E712
            )
            .order_by(MenuItem.display_order)
        )
        items = items_result.scalars().all()
        output.append({
            "id": cat.id,
            "name": cat.name,
            "display_order": cat.display_order,
            "menu_items": [_item_to_dict(i) for i in items],
        })

    # Fetch table number if table_id is provided
    table_number = None
    if table_id:
        tbl = await db.execute(select(Table).where(Table.id == table_id, Table.restaurant_id == restaurant_id))
        tbl_obj = tbl.scalar_one_or_none()
        if tbl_obj:
            table_number = tbl_obj.table_number

    return {
        "restaurant": {
            "id": restaurant.id,
            "name": restaurant.name,
            "logo_url": restaurant.logo_url,
            "address": restaurant.address,
        },
        "table_number": table_number,
        "categories": output,
    }


# ─── Admin: Categories ───────────────────────────────────────────────────────


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[CategoryOut]:
    """Admin only. Returns all categories for the current user's restaurant."""
    result = await db.execute(
        select(MenuCategory)
        .where(MenuCategory.restaurant_id == current_user.restaurant_id)
        .order_by(MenuCategory.display_order)
    )
    categories = result.scalars().all()
    return [CategoryOut.model_validate(c) for c in categories]


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CategoryCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> CategoryOut:
    """Admin only. Create a new menu category."""
    category = MenuCategory(
        id=uuid.uuid4(),
        restaurant_id=current_user.restaurant_id,
        name=body.name,
        display_order=body.display_order,
    )
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return CategoryOut.model_validate(category)


@router.put("/categories/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: uuid.UUID,
    body: CategoryUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> CategoryOut:
    """Admin only. Update a menu category."""
    result = await db.execute(
        select(MenuCategory).where(
            MenuCategory.id == category_id,
            MenuCategory.restaurant_id == current_user.restaurant_id,
        )
    )
    category: MenuCategory | None = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    await db.flush()
    await db.refresh(category)
    return CategoryOut.model_validate(category)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Admin only. Delete a category and all its menu items."""
    result = await db.execute(
        select(MenuCategory).where(
            MenuCategory.id == category_id,
            MenuCategory.restaurant_id == current_user.restaurant_id,
        )
    )
    category: MenuCategory | None = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    await db.delete(category)


# ─── Admin: Menu Items ───────────────────────────────────────────────────────


@router.get("/menu-items", response_model=list[MenuItemWithCategoryOut])
async def list_menu_items(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[MenuItemWithCategoryOut]:
    """Admin only. Returns all menu items for the current restaurant."""
    result = await db.execute(
        select(MenuItem)
        .options(selectinload(MenuItem.category))
        .where(MenuItem.restaurant_id == current_user.restaurant_id)
        .order_by(MenuItem.display_order)
    )
    items = result.scalars().all()

    output: list[MenuItemWithCategoryOut] = []
    for item in items:
        item_out = MenuItemWithCategoryOut.model_validate(item)
        if item.category:
            item_out.category = CategoryOut.model_validate(item.category)
        output.append(item_out)
    return output


@router.post("/menu-items", response_model=MenuItemOut, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    body: MenuItemCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> MenuItemOut:
    """Admin only. Create a new menu item. image_url should already be uploaded to Cloudinary."""
    # Verify the category belongs to this restaurant
    cat_result = await db.execute(
        select(MenuCategory).where(
            MenuCategory.id == body.category_id,
            MenuCategory.restaurant_id == current_user.restaurant_id,
        )
    )
    if not cat_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found in your restaurant",
        )

    item = MenuItem(
        id=uuid.uuid4(),
        category_id=body.category_id,
        restaurant_id=current_user.restaurant_id,
        name=body.name,
        description=body.description,
        price=body.price,
        image_url=body.image_url,
        is_available=body.is_available,
        is_veg=body.is_veg,
        display_order=body.display_order,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return MenuItemOut.model_validate(_item_to_dict(item))


@router.put("/menu-items/{item_id}", response_model=MenuItemOut)
async def update_menu_item(
    item_id: uuid.UUID,
    body: MenuItemUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> MenuItemOut:
    """Admin only. Update a menu item."""
    result = await db.execute(
        select(MenuItem).where(
            MenuItem.id == item_id,
            MenuItem.restaurant_id == current_user.restaurant_id,
        )
    )
    item: MenuItem | None = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    update_data = body.model_dump(exclude_unset=True)

    # If category_id is being changed, validate ownership
    if "category_id" in update_data:
        cat_result = await db.execute(
            select(MenuCategory).where(
                MenuCategory.id == update_data["category_id"],
                MenuCategory.restaurant_id == current_user.restaurant_id,
            )
        )
        if not cat_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found in your restaurant",
            )

    for field, value in update_data.items():
        setattr(item, field, value)

    await db.flush()
    await db.refresh(item)
    return MenuItemOut.model_validate(_item_to_dict(item))


@router.delete("/menu-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    item_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Admin only. Delete a menu item."""
    result = await db.execute(
        select(MenuItem).where(
            MenuItem.id == item_id,
            MenuItem.restaurant_id == current_user.restaurant_id,
        )
    )
    item: MenuItem | None = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    await db.delete(item)


@router.patch("/menu-items/{item_id}/toggle", response_model=MenuItemOut)
async def toggle_menu_item_availability(
    item_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> MenuItemOut:
    """Admin only. Toggle the is_available flag on a menu item."""
    result = await db.execute(
        select(MenuItem).where(
            MenuItem.id == item_id,
            MenuItem.restaurant_id == current_user.restaurant_id,
        )
    )
    item: MenuItem | None = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    item.is_available = not item.is_available
    await db.flush()
    await db.refresh(item)
    return MenuItemOut.model_validate(_item_to_dict(item))


# ─── Admin: Image Upload ─────────────────────────────────────────────────────


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("admin")),
) -> dict:
    """
    Admin only. Accepts a multipart image upload, uploads it to Cloudinary,
    and returns the secure URL.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are accepted",
        )

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image file must be under 10 MB",
        )

    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(contents),
            folder=f"restaurant_{current_user.restaurant_id}/menu",
            resource_type="image",
        )
        return {"url": result["secure_url"]}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Cloudinary upload failed: {exc}",
        )
