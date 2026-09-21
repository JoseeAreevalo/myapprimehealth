import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// npm workspace scripts run with cwd set to api/, so dotenv/config (which reads from cwd) never
// finds the repo-root .env. Load explicitly from both possible locations instead.
for (const candidate of [path.join(__dirname, '..', '..', '.env'), path.join(__dirname, '..', '..', '..', '.env')]) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be set to connect to PostgreSQL.');
}

export const pool = new Pool({ connectionString });

pool.on('error', (error) => {
  console.error('Unexpected error on idle PostgreSQL client.', error);
});
