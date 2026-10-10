-- Northeast AgriChain — core schema (auth + audit)
-- Idempotent: safe to run repeatedly (CREATE ... IF NOT EXISTS).
-- Targets PostgreSQL 13+ (Vercel Postgres / Neon). gen_random_uuid() is built in.

create table if not exists users (
  id                uuid primary key default gen_random_uuid(),
  phone             varchar(15)  not null unique,
  name              varchar(120) not null,
  role              varchar(20)  not null
                      check (role in ('farmer','fpo','buyer','transporter','admin')),
  state             varchar(80)  not null,
  district          varchar(80)  not null,
  block             varchar(80),
  language          varchar(8)   not null default 'en',
  preferred_channel varchar(16)  not null default 'sms',
  is_verified       boolean      not null default false,
  created_at        timestamptz  not null default now(),
  updated_at        timestamptz  not null default now()
);

create table if not exists sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references users(id) on delete cascade,
  refresh_hash text        not null,
  device       varchar(200),
  ip           varchar(64),
  expires_at   timestamptz not null,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists sessions_user_idx    on sessions (user_id);
create index if not exists sessions_refresh_idx on sessions (refresh_hash);

create table if not exists audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references users(id) on delete set null,
  action     varchar(80) not null,
  entity     varchar(80),
  entity_id  varchar(120),
  meta       jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on audit_logs (created_at desc);
