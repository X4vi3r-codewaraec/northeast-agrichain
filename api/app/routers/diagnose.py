"""POST /diagnose — image upload → deterministic result + optional LLM narration.

Pipeline (mirrors the on-device client):
  1. Validate + read the uploaded photo.
  2. Compute the diagnosis deterministically (severity, dosage, waiting days).
  3. Ask gpt-4o-mini only to *narrate* the decided result (never the numbers).
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, UploadFile

from app.schemas import DiagnosisResult
from app.services import diagnose_engine, llm

router = APIRouter(tags=["diagnose"])

MAX_BYTES = 6 * 1024 * 1024


@router.post("/diagnose", response_model=DiagnosisResult)
async def diagnose(
    image: UploadFile = File(...),
    crop_id: str = Form(...),
    district: str = Form(...),
    part: str = Form("leaf"),
    language: str = Form("en"),
) -> DiagnosisResult:
    image_bytes = await image.read()
    if len(image_bytes) > MAX_BYTES:
        image_bytes = image_bytes[:MAX_BYTES]

    result = diagnose_engine.diagnose(image_bytes, crop_id, district, part)
    result["createdAt"] = datetime.now(timezone.utc).isoformat()

    # Narration is optional and additive; the numeric result already stands.
    narration = await llm.narrate(result, language=language)
    if narration:
        result["notes"] = f"{result['notes']}\n\n{narration}"

    return DiagnosisResult(**result)
