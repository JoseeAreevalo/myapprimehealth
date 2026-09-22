-- RIR (Reps in Reserve) target per exercise (how close to failure each set should be),
-- and the actual RIR the client logs per set performed.
ALTER TABLE training_plan_exercises
  ADD COLUMN IF NOT EXISTS target_rir INTEGER;

ALTER TABLE training_set_logs
  ADD COLUMN IF NOT EXISTS actual_rir INTEGER;
