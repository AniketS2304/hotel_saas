import uuid
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut, OrderPaymentUpdate, OrderStatusUpdate
from app.websocket.manager import manager

router = APIRouter(prefix="/orders", tags=["Orders"])

# Simplified flow: customer places (pending) -> admin approves (accepted) -> waiter serves (served)
# Kitchen role is disabled; preparing/ready statuses are legacy and kept for data compatibility.
ALLOWED_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"accepted", "cancelled"},
    "accepted": {"served", "cancelled"},
    "cancelled": set(),
    # Legacy statuses kept for data compatibility
    "preparing": {"ready", "cancelled"},
    "ready": {"served", "cancelled"},
    "served": set(),
}


def _order_to_out(order: Order) -> OrderOut:
    """Serialize an order with optional table number from the related table."""
    out = OrderOut.model_validate(order)
    if order.table is not None:
        out.table_number = order.table.table_number
    return out


async def _get_order_with_items(db: AsyncSession, order_id: uuid.UUID) -> Order | None:
    """Helper to load an order eagerly with its items and table."""
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.order_items),
            selectinload(Order.table),
        )
        .where(Order.id == order_id)
    )
    return result.scalar_one_or_none()


# ─── PUBLIC: Place an order ──────────────────────────────────────────────────


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def place_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
) -> OrderOut:
    """
    PUBLIC endpoint (no auth). Customer places an order.
    Validates that all menu items belong to the specified restaurant.
    Calculates total and creates order + order_items in one transaction.
    Broadcasts a 'new_order' WebSocket event to the restaurant channel.
    """
    if not body.items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Order must contain at least one item",
        )

    # Validate all menu item IDs belong to the restaurant
    item_ids = [i.menu_item_id for i in body.items]
    result = await db.execute(
        select(MenuItem).where(
            MenuItem.id.in_(item_ids),
            MenuItem.restaurant_id == body.restaurant_id,
            MenuItem.is_available == True,  # noqa: E712
        )
    )
    db_items = result.scalars().all()
    db_item_map = {i.id: i for i in db_items}

    missing = [str(iid) for iid in item_ids if iid not in db_item_map]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"These menu item IDs are invalid or unavailable: {missing}",
        )

    # Build order
    total: Decimal = Decimal("0.00")
    order = Order(
        id=uuid.uuid4(),
        restaurant_id=body.restaurant_id,
        table_id=body.table_id,
        status="pending",
        total_amount=Decimal("0.00"),
        payment_status="unpaid",
        notes=body.notes,
    )
    db.add(order)
    await db.flush()  # get order.id

    order_items: list[OrderItem] = []
    for item_in in body.items:
        menu_item = db_item_map[item_in.menu_item_id]
        unit_price = menu_item.price
        total += unit_price * item_in.quantity
        oi = OrderItem(
            id=uuid.uuid4(),
            order_id=order.id,
            menu_item_id=item_in.menu_item_id,
            quantity=item_in.quantity,
            unit_price=unit_price,
            special_note=item_in.special_note,
        )
        db.add(oi)
        order_items.append(oi)

    order.total_amount = total
    await db.flush()
    await db.refresh(order)

    # Re-fetch with items and table loaded
    loaded_order = await _get_order_with_items(db, order.id)

    table_number = loaded_order.table.table_number if loaded_order and loaded_order.table else None

    # Broadcast via WebSocket
    await manager.broadcast_to_restaurant(
        restaurant_id=str(body.restaurant_id),
        event_type="new_order",
        data={
            "order_id": str(order.id),
            "table_id": str(body.table_id) if body.table_id else None,
            "table_number": table_number,
            "status": order.status,
            "total_amount": str(total),
            "item_count": len(body.items),
        },
    )

    return _order_to_out(loaded_order)


# ─── Staff: List orders ──────────────────────────────────────────────────────


@router.get("", response_model=list[OrderOut])
async def list_orders(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    table_id: Optional[uuid.UUID] = Query(default=None),
    current_user: User = Depends(require_role("admin", "waiter")),  # kitchen role disabled
    db: AsyncSession = Depends(get_db),
) -> list[OrderOut]:
    """
    Admin/Waiter. Returns all orders for their restaurant ordered by
    created_at DESC. Supports optional ?status= and ?table_id= query filters.
    """
    query = (
        select(Order)
        .options(
            selectinload(Order.order_items),
            selectinload(Order.table),
        )
        .where(Order.restaurant_id == current_user.restaurant_id)
        .order_by(Order.created_at.desc())
    )

    if status_filter:
        valid_statuses = {"pending", "accepted", "preparing", "ready", "served", "cancelled"}
        if status_filter not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter. Valid values: {valid_statuses}",
            )
        query = query.where(Order.status == status_filter)

    if table_id:
        query = query.where(Order.table_id == table_id)

    result = await db.execute(query)
    orders = result.scalars().all()
    return [_order_to_out(o) for o in orders]


# ─── PUBLIC: Get order by ID (customer tracking) ─────────────────────────────


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> OrderOut:
    """
    PUBLIC endpoint. Returns an order with its items and current status.
    Useful for the customer order-tracking page.
    """
    order = await _get_order_with_items(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return _order_to_out(order)


# ─── Staff: Update order status ──────────────────────────────────────────────


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: uuid.UUID,
    body: OrderStatusUpdate,
    current_user: User = Depends(require_role("admin", "waiter")),
    db: AsyncSession = Depends(get_db),
) -> OrderOut:
    """
    Admin: approve (pending → accepted) or cancel.
    Waiter: mark as served (accepted → served).
    Broadcasts an 'order_status_changed' WebSocket event after update.
    """
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.restaurant_id == current_user.restaurant_id,
        )
    )
    order: Order | None = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    allowed = ALLOWED_STATUS_TRANSITIONS.get(order.status, set())
    if body.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot change order status from '{order.status}' to '{body.status}'",
        )

    # Waiters may only mark orders as 'served' — not approve or cancel
    if current_user.role == "waiter" and body.status != "served":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Waiters can only mark orders as served",
        )

    order.status = body.status
    await db.flush()

    # Re-fetch with items
    loaded_order = await _get_order_with_items(db, order.id)

    # Broadcast status change
    await manager.broadcast_to_restaurant(
        restaurant_id=str(current_user.restaurant_id),
        event_type="order_status_changed",
        data={
            "order_id": str(order.id),
            "status": body.status,
            "table_id": str(order.table_id) if order.table_id else None,
        },
    )

    return _order_to_out(loaded_order)


# ─── Admin: Update payment status ────────────────────────────────────────────


@router.patch("/{order_id}/payment", response_model=OrderOut)
async def update_order_payment(
    order_id: uuid.UUID,
    body: OrderPaymentUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> OrderOut:
    """
    Admin only. Update the payment status of an order (e.g. 'paid').
    """
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.restaurant_id == current_user.restaurant_id,
        )
    )
    order: Order | None = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.payment_status = body.payment_status
    await db.flush()

    loaded_order = await _get_order_with_items(db, order.id)

    await manager.broadcast_to_restaurant(
        restaurant_id=str(current_user.restaurant_id),
        event_type="order_payment_changed",
        data={
            "order_id": str(order.id),
            "payment_status": body.payment_status,
        },
    )

    return _order_to_out(loaded_order)
