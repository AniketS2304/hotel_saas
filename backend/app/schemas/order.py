import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ─── Order Item ──────────────────────────────────────────────────────────────


class OrderItemIn(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = Field(..., ge=1)
    special_note: Optional[str] = None


class OrderItemOut(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    menu_item_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    special_note: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Order ───────────────────────────────────────────────────────────────────


class OrderCreate(BaseModel):
    restaurant_id: uuid.UUID
    table_id: Optional[uuid.UUID] = None
    items: list[OrderItemIn] = Field(..., min_length=1)
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        pattern="^(accepted|preparing|ready|served|cancelled)$",
    )


class OrderPaymentUpdate(BaseModel):
    payment_status: str = Field(
        ...,
        pattern="^(paid|unpaid)$",
    )


class OrderOut(BaseModel):
    id: uuid.UUID
    restaurant_id: uuid.UUID
    table_id: Optional[uuid.UUID] = None
    table_number: Optional[int] = None
    status: str
    total_amount: Decimal
    payment_status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    order_items: list[OrderItemOut] = []

    model_config = {"from_attributes": True}
