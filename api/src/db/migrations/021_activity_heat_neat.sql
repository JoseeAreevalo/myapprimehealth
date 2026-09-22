-- HEAT (structured cardio) + NEAT (daily steps) activity tracking, mirroring the
-- training_plans self/coach pattern: one active plan per client, per-weekday targets, and a
-- simple daily log so the coach can see what the client actually did.
CREATE TABLE IF NOT EXISTS activity_plans (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_plans_client_id ON activity_plans(client_id);

-- A client has at most one active activity plan at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_activity_plans_active_client
  ON activity_plans(client_id)
  WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS activity_cardio_targets (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES activity_plans(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  minutes INTEGER NOT NULL CHECK (minutes > 0),
  UNIQUE (plan_id, weekday)
);

CREATE TABLE IF NOT EXISTS activity_steps_targets (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES activity_plans(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  steps_target INTEGER NOT NULL CHECK (steps_target > 0),
  UNIQUE (plan_id, weekday)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT current_date,
  actual_cardio_minutes INTEGER,
  actual_steps INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_client_date ON activity_logs(client_id, log_date);
