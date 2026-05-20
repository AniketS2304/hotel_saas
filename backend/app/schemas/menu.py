import uuid
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ─── Category ───────────────────────────────────────────────────────────────


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    display_order: int = Field(default=0, ge=0)


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    display_order: Optional[int] = Field(default=None, ge=0)


class CategoryOut(BaseModel):
    id: uuid.UUID
    restaurant_id: uuid.UUID
    name: str
    display_order: int

    model_config = {"from_attributes": True}


class CategoryWithItemsOut(CategoryOut):
    menu_items: list["MenuItemOut"] = []


# ─── Menu Item ───────────────────────────────────────────────────────────────


class MenuItemCreate(BaseModel):
    category_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    image_url: Optional[str] = None
    is_available: bool = True
    is_veg: bool = True
    display_order: int = Field(default=0, ge=0)


class MenuItemUpdate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    is_veg: Optional[bool] = None
    display_order: Optional[int] = Field(default=None, ge=0)


class MenuItemOut(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    restaurant_id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: Decimal
    image_url: Optional[str] = None
    is_available: bool
    is_veg: bool
    display_order: int

    model_config = {"from_attributes": True}


class MenuItemWithCategoryOut(MenuItemOut):
    category: Optional[CategoryOut] = None


CategoryWithItemsOut.model_rebuild()
