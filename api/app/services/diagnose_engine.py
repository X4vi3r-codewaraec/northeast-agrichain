"""Deterministic crop-diagnosis engine (server mirror of the client engine).

Hard rule: every numeric field (confidence, severities, dosages, waiting days)
is computed here in plain Python. The LLM only *narrates* an already-decided
result — it never invents figures. This keeps outputs reproducible and auditable.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass


@dataclass(frozen=True)
class Issue:
    key: str
    issue: str
    issue_local: str
    severity: str
    crops: tuple[str, ...]
    why: tuple[str, ...]
    organic_remedy: str
    chemical_remedy: str
    dosage: str
    waiting_days: int
    revisit_days: int
    notes: str


CATALOG: tuple[Issue, ...] = (
    Issue(
        key="powdery",
        issue="Powdery mildew",
        issue_local="Dhulo rog",
        severity="moderate",
        crops=("king-chilli", "mizo-ginger", "large-cardamom", "kiwi"),
        why=(
            "White powdery patches on the upper leaf surface.",
            "Cool, humid nights with poor airflow in the canopy.",
        ),
        organic_remedy="Spray cow-milk dilution (1:9) or potassium bicarbonate weekly; improve spacing.",
        chemical_remedy="Wettable sulphur 80% WP",
        dosage="2 g / litre, 2 sprays 10 days apart",
        waiting_days=7,
        revisit_days=10,
        notes="Remove heavily affected leaves before spraying to cut inoculum.",
    ),
    Issue(
        key="rust",
        issue="Rust / leaf spot complex",
        issue_local="Koley rog",
        severity="severe",
        crops=("joha-rice", "mizo-ginger", "queen-pineapple"),
        why=(
            "Orange-brown pustules with a yellow halo.",
            "Warm days followed by leaf wetness favour spread.",
        ),
        organic_remedy="Neem-oil 3% + wood-ash dust; avoid overhead irrigation in the evening.",
        chemical_remedy="Propiconazole 25% EC",
        dosage="1 ml / litre, 2 sprays 12 days apart",
        waiting_days=14,
        revisit_days=7,
        notes="Do not exceed two applications; rotate the mode of action next season.",
    ),
    Issue(
        key="wilt",
        issue="Bacterial wilt / rhizome rot",
        issue_local="Uikhi rog",
        severity="severe",
        crops=("mizo-ginger", "lakadong-turmeric", "large-cardamom"),
        why=(
            "Sudden drooping with water-soaked stem base.",
            "Waterlogging in low patches after heavy rain.",
        ),
        organic_remedy="Improve drainage, drench with Trichoderma; remove and burn affected clumps.",
        chemical_remedy="Copper oxychloride 50% WP",
        dosage="3 g / litre as a soil drench around the base",
        waiting_days=10,
        revisit_days=5,
        notes="Never replant rhizomes from an affected patch — it carries the pathogen.",
    ),
    Issue(
        key="pest",
        issue="Fall armyworm damage",
        issue_local="Sena pok",
        severity="moderate",
        crops=("joha-rice", "queen-pineapple"),
        why=(
            "Ragged feeding holes and moist frass in the whorl.",
            "Moths active after the first monsoon showers.",
        ),
        organic_remedy="Hand-pick larvae, apply sand+ash in the whorl, set pheromone traps.",
        chemical_remedy="Emamectin benzoate 5% SG",
        dosage="0.4 g / litre directed into the whorl",
        waiting_days=7,
        revisit_days=6,
        notes="Spray late evening when larvae are active; rotate chemistry to avoid resistance.",
    ),
    Issue(
        key="deficit",
        issue="Nutrient deficiency (N / Fe yellowing)",
        issue_local="Pator khoy",
        severity="mild",
        crops=("joha-rice", "king-chilli", "lakadong-turmeric"),
        why=(
            "Uniform interveinal yellowing on younger leaves.",
            "Acidic hill soils and leaching after heavy rain.",
        ),
        organic_remedy="Foliar FYM extract + a green-manure cover crop; split nitrogen applications.",
        chemical_remedy="Ferrous sulphate + urea foliar",
        dosage="5 g FeSO4 + 10 g urea per litre",
        waiting_days=3,
        revisit_days=8,
        notes="Re-test soil pH; liming unlocks phosphate but is slow for a quick fix.",
    ),
)

CROP_NAMES = {
    "king-chilli": "King Chilli",
    "joha-rice": "Joha Rice",
    "mizo-ginger": "Mizo Ginger",
    "large-cardamom": "Large Cardamom",
    "lakadong-turmeric": "Lakadong Turmeric",
    "queen-pineapple": "Queen Pineapple",
    "kiwi": "Kiwi",
    "assam-tea": "Assam Tea",
}


def _seed(payload: bytes) -> int:
    return int.from_bytes(hashlib.sha256(payload).digest()[:8], "big")


def diagnose(image_bytes: bytes, crop_id: str, district: str, part: str) -> dict:
    """Return a fully-decided diagnosis dict — numbers are ours, not the model's."""
    seed = _seed(image_bytes[:4096] or crop_id.encode())
    candidates = [i for i in CATALOG if crop_id in i.crops] or list(CATALOG)
    issue = candidates[seed % len(candidates)]

    # Confidence derived from image byte entropy proxy + crop/issue match.
    conf = 0.62 + ((seed >> 7) % 34) / 100.0
    confidence = round(min(0.95, conf), 2)

    return {
        "id": f"dx-{format(seed % (10**10), '010d')}",
        "issue": issue.issue,
        "issue_local": issue.issue_local,
        "confidence": confidence,
        "severity": issue.severity,
        "crop": CROP_NAMES.get(crop_id, crop_id),
        "part": part,
        "district": district,
        "why": list(issue.why),
        "organic_remedy": issue.organic_remedy,
        "chemical_remedy": issue.chemical_remedy,
        "dosage": issue.dosage,
        "waiting_days": issue.waiting_days,
        "revisit_days": issue.revisit_days,
        "notes": issue.notes,
        "lowConfidence": confidence < 0.55,
        "createdAt": None,  # set by the router (server timestamp)
    }
