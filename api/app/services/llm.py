"""Thin wrapper around the OpenAI client.

Contract: this module is used ONLY to turn already-computed structured data into
human language (narration / translation). It must never be asked to produce a
number, score, dosage, ETA or payout — those come from deterministic code.
"""

from __future__ import annotations

import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_RULE = (
    "You are the Northeast AgriChain assistant. You ONLY narrate or translate "
    "facts that are given to you. Never invent numbers, dosages, scores, "
    "prices, ETAs or payouts. If a figure is needed and not provided, say it "
    "must be computed by the system. Keep replies short, practical and in the "
    "requested language."
)


async def narrate(structured: dict, language: str = "en") -> str | None:
    """Return a natural-language narration for a structured result, or None if
    the LLM is unavailable (callers should fall back to a template)."""
    if not settings.openai_api_key:
        return None
    try:
        from openai import AsyncOpenAI
    except Exception:  # pragma: no cover - dependency missing
        return None

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    try:
        resp = await client.chat.completions.create(
            model=settings.openai_model,  # gpt-4o-mini
            temperature=0.2,
            max_tokens=400,
            messages=[
                {"role": "system", "content": SYSTEM_RULE},
                {
                    "role": "user",
                    "content": (
                        f"Language: {language}\n"
                        "Narrate the following structured crop-diagnosis result for a "
                        "North-East Indian farmer. Do not add or change any number.\n"
                        f"{structured}"
                    ),
                },
            ],
        )
        return resp.choices[0].message.content
    except Exception as exc:  # pragma: no cover - network/LLM failure
        logger.warning("LLM narration failed: %s", exc)
        return None
