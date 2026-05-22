from contextlib import asynccontextmanager
from typing import AsyncGenerator

import cloudinary
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, menu, orders, restaurants, tables, staff
from app.core.config import settings
from app.websocket.router import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler: configure external services on startup."""
    # Configure Cloudinary only if credentials are provided
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
    yield
    # Nothing to teardown currently


def create_app() -> FastAPI:
    app = FastAPI(
        title="Restaurant QR Ordering API",
        description="Multi-restaurant QR-based ordering SaaS backend",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── API Routers ───────────────────────────────────────────────────────────
    api_prefix = "/api/v1"

    app.include_router(auth.router, prefix=api_prefix)
    app.include_router(menu.router, prefix=api_prefix)
    app.include_router(orders.router, prefix=api_prefix)
    app.include_router(tables.router, prefix=api_prefix)
    app.include_router(restaurants.router, prefix=api_prefix)
    app.include_router(staff.router, prefix=api_prefix)

    # ── WebSocket Router ──────────────────────────────────────────────────────
    app.include_router(ws_router)

    # ── Health Check ──────────────────────────────────────────────────────────
    @app.get("/", tags=["Health"])
    async def health_check() -> dict:
        return {"status": "ok", "service": "Restaurant QR Ordering API"}

    return app


app = create_app()
