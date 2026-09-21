CREATE TABLE IF NOT EXISTS foods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  calories_per_100g NUMERIC(7, 2) NOT NULL,
  protein_g NUMERIC(6, 2) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(6, 2) NOT NULL DEFAULT 0,
  fat_g NUMERIC(6, 2) NOT NULL DEFAULT 0,
  barcode TEXT UNIQUE,
  source TEXT NOT NULL DEFAULT 'local',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foods_name ON foods (lower(name));

INSERT INTO foods (name, calories_per_100g, protein_g, carbs_g, fat_g) VALUES
  ('Pechuga de pollo', 165, 31, 0, 3.6),
  ('Arroz blanco cocido', 130, 2.7, 28, 0.3),
  ('Huevo entero', 155, 13, 1.1, 11),
  ('Avena', 389, 16.9, 66, 6.9),
  ('Plátano', 89, 1.1, 23, 0.3),
  ('Leche entera', 61, 3.2, 4.8, 3.3),
  ('Aceite de oliva', 884, 0, 0, 100),
  ('Manzana', 52, 0.3, 14, 0.2),
  ('Brócoli', 34, 2.8, 7, 0.4),
  ('Salmón', 208, 20, 0, 13)
ON CONFLICT DO NOTHING;
