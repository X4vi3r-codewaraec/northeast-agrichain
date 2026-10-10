# Northeast AgriChain — API (FastAPI)

Backend for the Northeast AgriChain platform: agriculture, climate and
supply-chain intelligence for the 8 North-East Indian states.

> **Hard rule:** every numeric output (diagnosis confidence & severity, ETA,
> shelf-life index, dosages, waiting days, freight splits, insurance payouts) is
> computed in **deterministic code**. `gpt-4o-mini` is used **only** to narrate
> or translate an already-decided result — it never invents figures.

## Stack

| Concern    | Choice                                    |
| ---------- | ----------------------------------------- |
| Framework  | FastAPI + Uvicorn                         |
| Database   | PostgreSQL + PostGIS (async SQLAlchemy)   |
| Cache/OTP  | Redis                                     |
| Auth       | Phone + OTP → JWT (RBAC)                  |
| LLM        | OpenAI `gpt-4o-mini` (narration only)     |
| Packaging  | Docker / docker-compose                   |

## Layout

```
api/
├── app/
│   ├── main.py              # FastAPI app + router wiring (/api/v1)
│   ├── config.py            # env-driven settings (pydantic-settings)
│   ├── db.py                # async engine/session + Redis client
│   ├── security.py          # OTP hashing, JWT, RBAC dependencies
│   ├── schemas.py           # pydantic request/response models
│   ├── routers/
│   │   ├── health.py        # GET /health
│   │   ├── auth.py          # POST /auth/otp/request, /auth/otp/verify
│   │   ├── diagnose.py      # POST /diagnose (image → deterministic result)
│   │   └── modules.py       # weather/prices/marketplace/shipments/insurance/admin
│   └── services/
│       ├── diagnose_engine.py  # deterministic mirror of the client engine
│       └── llm.py              # gpt-4o-mini narration wrapper (guarded)
├── sql/schema.sql           # PostGIS schema (initial)
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## Run locally

```bash
cd api
python -m venv .venv
# Windows
. .venv/Scripts/activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # then set OPENAI_API_KEY, JWT_SECRET, OTP_PEPPER
uvicorn app.main:app --reload --port 8000
```

OpenAPI docs: <http://localhost:8000/docs>

## Run with Docker

```bash
cd api
cp .env.example .env
docker compose up --build
```

PostGIS initialises from `sql/schema.sql` on first boot.

## Key endpoints

| Method | Path                          | Notes                                   |
| ------ | ----------------------------- | --------------------------------------- |
| GET    | `/health`                     | Liveness                                |
| POST   | `/api/v1/auth/otp/request`    | Sends OTP (echoed only in development)  |
| POST   | `/api/v1/auth/otp/verify`     | Returns JWT + session                   |
| POST   | `/api/v1/diagnose`            | Multipart image → `DiagnosisResult`     |
| GET    | `/api/v1/weather/{district}`  | Auth required                           |
| GET    | `/api/v1/prices/{crop_id}`    | Public                                  |
| GET    | `/api/v1/marketplace`         | Public                                  |
| GET    | `/api/v1/shipments`           | Auth required                           |
| GET    | `/api/v1/insurance/policies`  | Auth required                           |
| GET    | `/api/v1/admin/surveillance`  | **admin only**                          |

## Status

Scaffold only. The frontend currently runs against its own deterministic demo
engines (same contracts), so pointing it at this service is a config change, not
a rewrite. Next steps: map the PostGIS models with Alembic, wire the Open-Meteo
and mandi/eNAM data adapters, and add the SMS OTP gateway.
