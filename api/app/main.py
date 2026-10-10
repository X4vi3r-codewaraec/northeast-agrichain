"""Northeast AgriChain API — FastAPI entrypoint.

Run locally:
    cd api
    python -m venv .venv && . .venv/Scripts/activate   # Windows
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

Docs: http://localhost:8000/docs
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, diagnose, health, modules

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(
    title="Northeast AgriChain API",
    version="0.1.0",
    description=(
        "Agriculture, climate & supply-chain intelligence for North-East India. "
        "All numeric outputs (scores, ETA, shelf-life, dosages, payouts) are "
        "computed deterministically; gpt-4o-mini is used for narration only."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
app.include_router(health.router)
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(diagnose.router, prefix=API_PREFIX)
app.include_router(modules.router, prefix=API_PREFIX)


@app.get("/")
async def root() -> dict:
    return {
        "service": "Northeast AgriChain API",
        "version": "0.1.0",
        "docs": "/docs",
        "api": API_PREFIX,
    }
