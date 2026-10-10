"""Phone + OTP authentication issuing a JWT session (mirrors the web demo flow).

In production, replace the `dev_otp` echo with an SMS gateway (MSG91 / Gupshup)
and store the OTP hash in Redis under `otp:{phone}` with a short TTL.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.db import get_redis
from app.schemas import OtpRequest, OtpRequestResponse, OtpVerify, TokenResponse
from app.security import create_access_token, generate_otp, hash_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/otp/request", response_model=OtpRequestResponse)
async def request_otp(payload: OtpRequest) -> OtpRequestResponse:
    code = generate_otp()
    redis = get_redis()
    await redis.setex(f"otp:{payload.phone}", settings.otp_ttl_seconds, hash_otp(code))

    # A real deployment sends `code` over SMS and never returns it.
    dev_otp = code if settings.environment == "development" else None
    return OtpRequestResponse(sent=True, ttl_seconds=settings.otp_ttl_seconds, dev_otp=dev_otp)


@router.post("/otp/verify", response_model=TokenResponse)
async def verify(payload: OtpVerify) -> TokenResponse:
    redis = get_redis()
    digest = await redis.get(f"otp:{payload.phone}")
    if digest is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired or not requested")
    if not verify_otp(payload.otp, digest):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect OTP")

    await redis.delete(f"otp:{payload.phone}")
    token = create_access_token(subject=payload.phone, role=payload.role)
    session = {
        "name": payload.name or f"Farmer {payload.phone[-4:]}",
        "role": payload.role,
        "state": payload.state,
        "district": payload.district,
        "lang": payload.lang,
    }
    return TokenResponse(access_token=token, session=session)
