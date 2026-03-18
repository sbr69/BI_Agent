"""
Supabase JWT Authentication module.
Verifies JWT tokens issued by Supabase Auth.
"""

import os
from typing import Optional
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# JWT settings
ALGORITHM = "HS256"

# Security scheme
security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    """Represents an authenticated Supabase user."""

    def __init__(self, user_id: str, email: str, role: str, metadata: dict):
        self.id = user_id
        self.email = email
        self.role = role
        self.metadata = metadata

    def __repr__(self):
        return f"<AuthenticatedUser id={self.id} email={self.email}>"


def verify_token(token: str) -> dict:
    """
    Verify a Supabase JWT token.

    Args:
        token: The JWT token string

    Returns:
        The decoded token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Server configuration error: SUPABASE_JWT_SECRET not set"
        )

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM],
            audience="authenticated"
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired token: {str(e)}"
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthenticatedUser:
    """
    FastAPI dependency to get the current authenticated user.

    Usage:
        @app.get("/protected")
        async def protected_route(user: AuthenticatedUser = Depends(get_current_user)):
            return {"user_id": user.id}
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide a valid Bearer token."
        )

    payload = verify_token(credentials.credentials)

    # Extract user info from Supabase JWT payload
    user_id = payload.get("sub")
    email = payload.get("email", "")
    role = payload.get("role", "authenticated")
    user_metadata = payload.get("user_metadata", {})

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token: missing user ID"
        )

    return AuthenticatedUser(
        user_id=user_id,
        email=email,
        role=role,
        metadata=user_metadata
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthenticatedUser]:
    """
    FastAPI dependency to optionally get the current user.
    Returns None if no valid token is provided (instead of raising an error).

    Usage:
        @app.get("/semi-protected")
        async def route(user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
            if user:
                return {"message": f"Hello {user.email}"}
            return {"message": "Hello anonymous"}
    """
    if not credentials:
        return None

    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None

        return AuthenticatedUser(
            user_id=user_id,
            email=payload.get("email", ""),
            role=payload.get("role", "authenticated"),
            metadata=payload.get("user_metadata", {})
        )
    except HTTPException:
        return None
