-- Northeast AgriChain — PostgreSQL + PostGIS schema (initial).
-- Apply with:  psql "$DATABASE_URL" -f sql/schema.sql
-- (Alembic migrations will own this once models are mapped.)

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- Users & roles -------------------------------------------------------- --
CREATE TABLE IF NOT EXISTS users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone        VARCHAR(10) UNIQUE NOT NULL,
    name         TEXT,
    role         TEXT NOT NULL CHECK (role IN ('farmer','fpo','buyer','transporter','admin')),
    state        TEXT,
    district     TEXT,
    lang         TEXT DEFAULT 'en',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Farms (geography) ---------------------------------------------------- --
CREATE TABLE IF NOT EXISTS farms (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT,
    district     TEXT,
    state        TEXT,
    area_ha      NUMERIC(10,3),
    polygon      GEOGRAPHY(POLYGON, 4326),
    soil_ph      NUMERIC(3,1),
    soil_n       INTEGER,
    soil_p       INTEGER,
    soil_k       INTEGER,
    organic_carbon NUMERIC(4,2),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS farms_polygon_gix ON farms USING GIST (polygon);

-- ---- Diagnoses ------------------------------------------------------------ --
CREATE TABLE IF NOT EXISTS diagnoses (
    id            TEXT PRIMARY KEY,
    user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    farm_id       UUID REFERENCES farms(id) ON DELETE SET NULL,
    crop_id       TEXT NOT NULL,
    district      TEXT,
    issue         TEXT,
    confidence    NUMERIC(4,3),
    severity      TEXT,
    payload       JSONB NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Listings ------------------------------------------------------------- --
CREATE TABLE IF NOT EXISTS listings (
    id            TEXT PRIMARY KEY,
    seller_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    crop_id       TEXT NOT NULL,
    qty_t         NUMERIC(10,3),
    price_per_kg  NUMERIC(10,2),
    grade         CHAR(1),
    organic       BOOLEAN DEFAULT FALSE,
    gi_cert       BOOLEAN DEFAULT FALSE,
    district      TEXT,
    state         TEXT,
    point         GEOGRAPHY(POINT, 4326),
    trace_to_farm BOOLEAN DEFAULT TRUE,
    status        TEXT DEFAULT 'active',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listings_point_gix ON listings USING GIST (point);
CREATE INDEX IF NOT EXISTS listings_crop_idx ON listings (crop_id);

-- ---- Shipments & telemetry ------------------------------------------------ --
CREATE TABLE IF NOT EXISTS shipments (
    id            TEXT PRIMARY KEY,
    crop_id       TEXT NOT NULL,
    qty_t         NUMERIC(10,3),
    origin        TEXT,
    dest          TEXT,
    status        TEXT,
    eta_min       INTEGER,
    cold_chain    BOOLEAN DEFAULT FALSE,
    pooled        INTEGER DEFAULT 1,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipment_telemetry (
    id            BIGSERIAL PRIMARY KEY,
    shipment_id   TEXT REFERENCES shipments(id) ON DELETE CASCADE,
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    temp_c        NUMERIC(5,2),
    humidity      NUMERIC(5,2)
);

-- ---- Policies & claims ---------------------------------------------------- --
CREATE TABLE IF NOT EXISTS policies (
    id            TEXT PRIMARY KEY,
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    crop_id       TEXT,
    sum_insured   NUMERIC(12,2),
    premium       NUMERIC(12,2),
    status        TEXT,
    valid_until   DATE
);

CREATE TABLE IF NOT EXISTS claims (
    id            TEXT PRIMARY KEY,
    policy_id     TEXT REFERENCES policies(id) ON DELETE CASCADE,
    event         TEXT,
    status        TEXT,
    amount        NUMERIC(12,2),
    payload       JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
