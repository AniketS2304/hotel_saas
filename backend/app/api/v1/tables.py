import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.core.config import settings
from app.db.session import get_db
from app.models.table import Table
from app.models.user import User
from app.schemas.table import TableCreate, TableOut
from app.services.qr_service import generate_qr_code

router = APIRouter(prefix="/tables", tags=["Tables"])


@router.get("", response_model=list[TableOut])
async def list_tables(
    current_user: User = Depends(require_role("admin", "waiter")),
    db: AsyncSession = Depends(get_db),
) -> list[TableOut]:
    """Admin/Waiter. Returns all active tables for the current restaurant."""
    result = await db.execute(
        select(Table)
        .where(
            Table.restaurant_id == current_user.restaurant_id,
            Table.is_active == True,  # noqa: E712
        )
        .order_by(Table.table_number)
    )
    tables = result.scalars().all()
    return [TableOut.model_validate(t) for t in tables]


@router.post("", response_model=TableOut, status_code=status.HTTP_201_CREATED)
async def create_table(
    body: TableCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> TableOut:
    """
    Admin only. Create a new table and generate a QR code pointing to
    {BASE_URL}/menu/{restaurant_id}/{table_id}.
    Returns the table with qr_code_url as a base64 PNG data URL.
    """
    # Check for duplicate table number within this restaurant
    existing = await db.execute(
        select(Table).where(
            Table.restaurant_id == current_user.restaurant_id,
            Table.table_number == body.table_number,
            Table.is_active == True,  # noqa: E712
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Table number {body.table_number} already exists in your restaurant",
        )

    table_id = uuid.uuid4()
    qr_url = f"{settings.BASE_URL}/menu/{current_user.restaurant_id}/{table_id}"
    qr_data_url = generate_qr_code(qr_url)

    table = Table(
        id=table_id,
        restaurant_id=current_user.restaurant_id,
        table_number=body.table_number,
        qr_code_url=qr_data_url,
        is_active=True,
    )
    db.add(table)
    await db.flush()
    await db.refresh(table)
    return TableOut.model_validate(table)


@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_table(
    table_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Admin only. Soft-delete a table by setting is_active=False."""
    result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.restaurant_id == current_user.restaurant_id,
        )
    )
    table: Table | None = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")

    table.is_active = False
    await db.flush()
