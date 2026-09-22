import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool, types } from 'pg';

// npm workspace scripts run with cwd set to api/, so dotenv/config (which reads from cwd) never
// finds the repo-root .env. Load explicitly from both possible locations instead.
for (const candidate of [path.join(__dirname, '..', '..', '.env'), path.join(__dirname, '..', '..', '..', '.env')]) {
    if (fs.existsSync(candidate)) {
        dotenv.config({ path: candidate });
    }
}

// pg's default parser turns DATE columns into JS Date objects, which then serialize to
// "YYYY-MM-DDT00:00:00.000Z" over JSON instead of the plain "YYYY-MM-DD" every date-range
// comparison in the frontend expects (e.g. calendar day === plan.endDate). Keep DATE as text.
types.setTypeParser(types.builtins.DATE, (value) => value);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL must be set to connect to PostgreSQL.');
}

export const pool = new Pool({ connectionString });

pool.on('error', (error) => {
    console.error('Unexpected error on idle PostgreSQL client.', error);
});
