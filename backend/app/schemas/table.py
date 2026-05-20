import uuid
from typing import Optional

from pydantic import BaseModel, Field


class TableCreate(BaseModel):
    table_number: int = Field(..., ge=1)


class TableOut(BaseModel):
    id: uuid.UUID
    restaurant_id: uuid.UUID
    table_number: int
    qr_code_url: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}
