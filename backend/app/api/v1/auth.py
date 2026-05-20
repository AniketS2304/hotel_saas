import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """
    Create a new restaurant and its first admin user atomically.
    Returns access + refresh tokens immediately.
    """
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create restaurant
    restaurant = Restaurant(
        id=uuid.uuid4(),
        name=body.restaurant_name,
    )
    db.add(restaurant)
    await db.flush()  # get restaurant.id without committing

    # Create admin user
    user = User(
        id=uuid.uuid4(),
        restaurant_id=restaurant.id,
        name=body.name,
        email=body.email,
        password_hash=get_password_hash(body.password),
        role="admin",
    )
    db.add(user)
    await db.flush()

    token_data = {"sub": str(user.id), "restaurant_id": str(restaurant.id), "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user_out = UserOut.model_validate(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_out,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Authenticate with email + password, returns access + refresh tokens."""
    result = await db.execute(select(User).where(User.email == body.email))
    user: User | None = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    token_data = {"sub": str(user.id), "restaurant_id": str(user.restaurant_id), "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user_out = UserOut.model_validate(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_out,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> AccessTokenResponse:
    """Exchange a valid refresh token for a new access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise credentials_exception
        user_id_str: str | None = payload.get("sub")
        if not user_id_str:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise credentials_exception

    token_data = {"sub": str(user.id), "restaurant_id": str(user.restaurant_id), "role": user.role}
    new_access_token = create_access_token(token_data)

    return AccessTokenResponse(access_token=new_access_token)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    """Returns the currently authenticated user's profile."""
    return UserOut.model_validate(current_user)
