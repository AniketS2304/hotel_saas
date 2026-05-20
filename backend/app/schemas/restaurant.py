import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RestaurantUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    address: Optional[str] = Field(default=None, max_length=512)
    logo_url: Optional[str] = Field(default=None, max_length=1024)


class RestaurantOut(BaseModel):
    id: uuid.UUID
    name: str
    logo_url: Optional[str] = None
    address: Optional[str] = None
    subscription_plan: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
