-- Lets a client record the actual grams served per food item when logging a meal, so
-- macros reflect what was really eaten instead of only the plan's target grams.
ALTER TABLE nutrition_meal_logs
  ADD COLUMN IF NOT EXISTS logged_items JSONB,
  ADD COLUMN IF NOT EXISTS logged_calories NUMERIC;
