-- Lets a nutrition plan span an explicit date range, and lets it define 1+ "day configurations"
-- (e.g. "Día de entrenamiento" vs "Día de descanso") each covering a checked set of weekdays,
-- with their own meals - so the diet can differ between training days and rest days.
ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS end_date DATE;

CREATE TABLE IF NOT EXISTS nutrition_day_configs (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  weekdays SMALLINT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_day_configs_plan_id ON nutrition_day_configs (plan_id);

-- Null means the meal is not tied to a specific day configuration (applies every day - the
-- pre-existing/simple behavior).
ALTER TABLE nutrition_meals ADD COLUMN IF NOT EXISTS day_config_id INTEGER REFERENCES nutrition_day_configs(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_nutrition_meals_day_config_id ON nutrition_meals (day_config_id);
