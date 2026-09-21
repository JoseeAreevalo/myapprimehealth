CREATE TABLE IF NOT EXISTS nutrition_plans (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL,
  label TEXT NOT NULL,
  goal_calories INTEGER NOT NULL CHECK (goal_calories > 0),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_plans_client_id ON nutrition_plans(client_id);

-- A client has at most one active plan at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_nutrition_plans_active_client
  ON nutrition_plans(client_id)
  WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS nutrition_meals (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  detail TEXT,
  meal_time TEXT,
  calories INTEGER NOT NULL CHECK (calories >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_nutrition_meals_plan_id ON nutrition_meals(plan_id);

CREATE TABLE IF NOT EXISTS nutrition_meal_logs (
  id SERIAL PRIMARY KEY,
  meal_id INTEGER NOT NULL REFERENCES nutrition_meals(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT current_date,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('completed', 'next', 'planned')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meal_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_meal_logs_client_date ON nutrition_meal_logs(client_id, log_date);
