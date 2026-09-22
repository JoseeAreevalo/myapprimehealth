-- Lets a routine specify when it starts/ends being in effect, matching nutrition plans.
ALTER TABLE training_plans
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;
