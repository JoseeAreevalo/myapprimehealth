CREATE TABLE IF NOT EXISTS training_plans (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_plans_client_id ON training_plans(client_id);

-- A client has at most one active training plan at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_training_plans_active_client
  ON training_plans(client_id)
  WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS training_plan_days (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  day_order INTEGER NOT NULL,
  label TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_training_plan_days_plan_id ON training_plan_days(plan_id);

CREATE TABLE IF NOT EXISTS training_plan_exercises (
  id SERIAL PRIMARY KEY,
  day_id INTEGER NOT NULL REFERENCES training_plan_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_sets INTEGER NOT NULL CHECK (target_sets > 0),
  target_reps INTEGER NOT NULL CHECK (target_reps > 0),
  target_weight_kg NUMERIC(6, 2),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_training_plan_exercises_day_id ON training_plan_exercises(day_id);

CREATE TABLE IF NOT EXISTS training_set_logs (
  id SERIAL PRIMARY KEY,
  exercise_id INTEGER NOT NULL REFERENCES training_plan_exercises(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT current_date,
  set_number INTEGER NOT NULL,
  actual_reps INTEGER,
  actual_weight_kg NUMERIC(6, 2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exercise_id, log_date, set_number)
);

CREATE INDEX IF NOT EXISTS idx_training_set_logs_exercise_date ON training_set_logs(exercise_id, log_date);
