CREATE TABLE IF NOT EXISTS check_ins (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  week_start_date DATE NOT NULL,
  weight_kg NUMERIC(6, 2),
  measurements JSONB,
  adherence_percent INTEGER CHECK (adherence_percent BETWEEN 0 AND 100),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed')),
  coach_feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_check_ins_client_id ON check_ins(client_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_coach_id ON check_ins(coach_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_status ON check_ins(status);
