-- Anchor each training day to an actual weekday (1=Lunes .. 7=Domingo) instead of a generic order,
-- and let a plan declare how many weeks it should run before the next progression/review.
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS duration_weeks INTEGER NOT NULL DEFAULT 4;
ALTER TABLE training_plan_days ADD COLUMN IF NOT EXISTS weekday SMALLINT CHECK (weekday BETWEEN 1 AND 7);

CREATE UNIQUE INDEX IF NOT EXISTS uq_training_plan_days_weekday ON training_plan_days (plan_id, weekday) WHERE weekday IS NOT NULL;
