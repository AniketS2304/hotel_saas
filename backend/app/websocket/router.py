import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.auth.utils import decode_token
from app.websocket.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])

PING_INTERVAL_SECONDS = 25  # Send ping every 25 seconds to keep connection alive


@router.websocket("/ws/{restaurant_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    restaurant_id: str,
    token: Optional[str] = Query(default=None),
) -> None:
    """
    WebSocket endpoint for real-time restaurant events.

    Connect with:  ws://<host>/ws/<restaurant_id>?token=<jwt>
    Token is optional but validated if provided.

    Events pushed to clients:
    - {"event": "new_order", "data": {...}}
    - {"event": "order_status_changed", "data": {...}}
    - {"event": "ping", "data": {}} (keepalive)
    """
    # Validate token if provided
    if token:
        try:
            payload = decode_token(token)
            token_restaurant_id = payload.get("restaurant_id")
            # Optionally enforce restaurant_id match
            if token_restaurant_id and token_restaurant_id != restaurant_id:
                await websocket.close(code=4003, reason="Token restaurant mismatch")
                return
        except JWTError:
            await websocket.close(code=4001, reason="Invalid token")
            return

    await manager.connect(restaurant_id, websocket)

    try:
        # Run ping loop and message receiver concurrently
        async def ping_loop() -> None:
            while True:
                await asyncio.sleep(PING_INTERVAL_SECONDS)
                try:
                    await websocket.send_text(json.dumps({"event": "ping", "data": {}}))
                except Exception:
                    break

        async def receive_loop() -> None:
            """Consume any incoming client messages (pong responses, etc.)."""
            while True:
                try:
                    msg = await websocket.receive_text()
                    # Handle client pong or any control messages silently
                    logger.debug("WS message from client [%s]: %s", restaurant_id, msg)
                except WebSocketDisconnect:
                    break
                except Exception:
                    break

        ping_task = asyncio.create_task(ping_loop())
        recv_task = asyncio.create_task(receive_loop())

        # Wait for either task to finish (disconnect or error)
        done, pending = await asyncio.wait(
            [ping_task, recv_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()

    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(restaurant_id, websocket)
