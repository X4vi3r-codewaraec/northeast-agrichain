"""Pydantic request/response schemas shared across routers."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["farmer", "fpo", "buyer", "transporter", "admin"]


# ---- Auth ----------------------------------------------------------------- #
class OtpRequest(BaseModel):
    phone: str = Field(pattern=r"^\d{10}$", examples=["9876543210"])


class OtpRequestResponse(BaseModel):
    sent: bool
    ttl_seconds: int
    # Only populated in development so the demo flow works without SMS.
    dev_otp: str | None = None


class OtpVerify(BaseModel):
    phone: str = Field(pattern=r"^\d{10}$")
    otp: str = Field(pattern=r"^\d{6}$")
    name: str | None = None
    role: Role = "farmer"
    state: str = "Assam"
    district: str = "Jorhat"
    lang: str = "en"


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    session: dict


# ---- Diagnosis ------------------------------------------------------------ #
class DiagnosisResult(BaseModel):
    id: str
    issue: str
    issue_local: str
    confidence: float
    severity: Literal["mild", "moderate", "severe"]
    crop: str
    part: Literal["leaf", "fruit", "stem", "whole"]
    district: str
    createdAt: str
    why: list[str]
    organic_remedy: str
    chemical_remedy: str
    dosage: str
    waiting_days: int
    revisit_days: int
    notes: str
    lowConfidence: bool
