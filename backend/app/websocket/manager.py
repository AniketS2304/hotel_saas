import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections grouped by restaurant_id.
    Provides broadcast functionality to all connected clients
    for a given restaurant channel.
    """

    def __init__(self) -> None:
        # Maps restaurant_id (str) -> list of active WebSocket connections
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, restaurant_id: str, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        if restaurant_id not in self.active_connections:
            self.active_connections[restaurant_id] = []
        self.active_connections[restaurant_id].append(websocket)
        logger.info(
            "WebSocket connected: restaurant=%s, total=%d",
            restaurant_id,
            len(self.active_connections[restaurant_id]),
        )

    async def disconnect(self, restaurant_id: str, websocket: WebSocket) -> None:
        """Remove a WebSocket connection from the registry."""
        if restaurant_id in self.active_connections:
            try:
                self.active_connections[restaurant_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[restaurant_id]:
                del self.active_connections[restaurant_id]
        logger.info("WebSocket disconnected: restaurant=%s", restaurant_id)

    async def broadcast_to_restaurant(
        self, restaurant_id: str, event_type: str, data: dict[str, Any]
    ) -> None:
        """
        Send a JSON event to all connected WebSocket clients for a restaurant.
        Silently drops stale connections.
        """
        payload = json.dumps({"event": event_type, "data": data})
        connections = self.active_connections.get(restaurant_id, [])
        dead: list[WebSocket] = []

        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)

        # Clean up any dead connections
        for ws in dead:
            await self.disconnect(restaurant_id, ws)


# Module-level singleton used across the application
manager = ConnectionManager()
