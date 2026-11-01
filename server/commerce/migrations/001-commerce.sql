-- Explicitly applied before the HTTP server starts. Never run during a request.
CREATE TABLE IF NOT EXISTS commerce_schema_migrations (
  version INTEGER PRIMARY KEY,
  checksum TEXT NOT NULL,
  applied_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE commerce_orders (
  id TEXT PRIMARY KEY,
  quote_hash TEXT NOT NULL,
  order_hash TEXT NOT NULL,
  order_json TEXT NOT NULL CHECK (json_valid(order_json)),
  total_minor INTEGER NOT NULL CHECK (total_minor > 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  created_at_ms INTEGER NOT NULL
) STRICT;

CREATE TRIGGER commerce_orders_immutable_update BEFORE UPDATE ON commerce_orders
BEGIN SELECT RAISE(ABORT, 'commerce order is immutable'); END;
CREATE TRIGGER commerce_orders_immutable_delete BEFORE DELETE ON commerce_orders
BEGIN SELECT RAISE(ABORT, 'commerce order is immutable'); END;

CREATE TABLE commerce_stripe_sessions (
  session_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES commerce_orders(id),
  quote_hash TEXT NOT NULL,
  bound_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE commerce_draft_reservations (
  order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),
  external_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL UNIQUE,
  payment_reference TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('reserved', 'created', 'uncertain', 'failed')),
  attempted INTEGER NOT NULL DEFAULT 0 CHECK (attempted IN (0, 1)),
  printful_id INTEGER UNIQUE CHECK (printful_id IS NULL OR printful_id > 0),
  failure_code TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count BETWEEN 0 AND 10000),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;

-- Deliberately no session FK: a verified webhook can precede session binding.
CREATE TABLE commerce_payment_events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider_created INTEGER NOT NULL CHECK (provider_created >= 0),
  received_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE commerce_payment_jobs (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE REFERENCES commerce_payment_events(event_id),
  state TEXT NOT NULL CHECK (state IN ('pending', 'processing', 'completed', 'dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  available_at_ms INTEGER NOT NULL,
  worker_id TEXT,
  lease_token TEXT UNIQUE,
  lease_expires_at_ms INTEGER,
  last_error_code TEXT,
  completed_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  CHECK ((state = 'processing' AND worker_id IS NOT NULL AND lease_token IS NOT NULL AND lease_expires_at_ms IS NOT NULL)
    OR (state != 'processing' AND worker_id IS NULL AND lease_token IS NULL AND lease_expires_at_ms IS NULL))
) STRICT;
CREATE INDEX commerce_payment_jobs_available ON commerce_payment_jobs(state, available_at_ms, created_at_ms);
