"""Representative module endpoints establishing the `/api/v1` surface.

These return deterministic demo payloads so the frontend can be pointed at the
live service without behavioural changes. Each will be backed by PostGIS/Redis
queries (weather via Open-Meteo, marketplace via PostGIS radius search, etc.).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.security import Principal, get_current_user, require_roles

router = APIRouter(tags=["modules"])


@router.get("/weather/{district}")
async def weather(district: str, _: Principal = Depends(get_current_user)) -> dict:
    # Live: Open-Meteo forecast + crop-calendar advisories.
    return {"district": district, "source": "demo", "forecast": [], "alerts": []}


@router.get("/prices/{crop_id}")
async def prices(crop_id: str) -> dict:
    # Live: mandi + eNAM aggregation with fair-value bands.
    return {"cropId": crop_id, "source": "demo", "series": [], "fairBand": None}


@router.get("/marketplace")
async def marketplace(
    district: str | None = None, crop_id: str | None = None
) -> dict:
    # Live: PostGIS radius + grade/price filters.
    return {"source": "demo", "filters": {"district": district, "cropId": crop_id}, "listings": []}


@router.get("/shipments")
async def shipments(_: Principal = Depends(get_current_user)) -> dict:
    # Live: tracking events + cold-chain sensor stream.
    return {"source": "demo", "shipments": []}


@router.get("/insurance/policies")
async def insurance_policies(_: Principal = Depends(get_current_user)) -> dict:
    return {"source": "demo", "policies": []}


@router.get("/admin/surveillance")
async def surveillance(_: Principal = Depends(require_roles("admin"))) -> dict:
    # Admin-only: regional pest/flood/price-anomaly signals.
    return {"source": "demo", "states": [], "surveillance": []}
