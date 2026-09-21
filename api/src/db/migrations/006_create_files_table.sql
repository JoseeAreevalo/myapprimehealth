CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  related_type TEXT NOT NULL CHECK (related_type IN ('check_in')),
  related_id INTEGER NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_related ON files(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);
