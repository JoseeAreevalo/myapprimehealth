CREATE TABLE IF NOT EXISTS nutrition_meal_items (
  id SERIAL PRIMARY KEY,
  meal_id INTEGER NOT NULL REFERENCES nutrition_meals(id) ON DELETE CASCADE,
  food_id INTEGER REFERENCES foods(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  grams NUMERIC NOT NULL CHECK (grams > 0),
  calories NUMERIC NOT NULL DEFAULT 0,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_meal_items_meal_id ON nutrition_meal_items (meal_id);

-- Lets a coach/client define swappable alternatives for the same meal slot (e.g. "Almuerzo - Opción A/B").
ALTER TABLE nutrition_meals ADD COLUMN IF NOT EXISTS alternative_group TEXT;
ALTER TABLE nutrition_meals ADD COLUMN IF NOT EXISTS alternative_label TEXT;
