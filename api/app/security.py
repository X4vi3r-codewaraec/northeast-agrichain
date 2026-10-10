"""OTP + JWT auth primitives and role-based access control.

Design notes:
  * OTP codes are 6-digit, hashed with HMAC-SHA256(pepper) before storage in
    Redis, and expire after `OTP_TTL_SECONDS`.
  * Access tokens are short-lived JWTs carrying `sub` (phone) and `role`.
  * RBAC is enforced by `require_roles(...)`, mirroring the frontend roles.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()

Role = Literal["farmer", "fpo", "buyer", "transporter", "admin"]

_bearer = HTTPBearer(auto_error=False)


# --------------------------------------------------------------------------- #
# OTP
# --------------------------------------------------------------------------- #
def generate_otp() -> str:
    """Cryptographically-random 6-digit code (leading zeros allowed)."""
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(code: str) -> str:
    return hmac.new(
        settings.otp_pepper.encode(), code.encode(), hashlib.sha256
    ).hexdigest()


def verify_otp(code: str, digest: str) -> bool:
    return hmac.compare_digest(hash_otp(code), digest)


# --------------------------------------------------------------------------- #
# JWT
# --------------------------------------------------------------------------- #
def create_access_token(subject: str, role: Role) -> str:
    now = datetime.now(timezone.utc)
    claims = {
        "sub": subject,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_ttl_min)).timestamp()),
    }
    return jwt.encode(claims, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


# --------------------------------------------------------------------------- #
# Dependencies
# --------------------------------------------------------------------------- #
class Principal(dict):
    @property
    def phone(self) -> str:
        return self["sub"]

    @property
    def role(self) -> Role:
        return self["role"]


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Principal:
    if creds is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )
    return Principal(decode_token(creds.credentials))


def require_roles(*roles: Role):
    """Dependency factory enforcing that the caller holds one of `roles`."""

    async def _guard(user: Principal = Depends(get_current_user)) -> Principal:
        if roles and user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(roles)}",
            )
        return user

    return _guard
