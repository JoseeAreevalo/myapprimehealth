import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be set to connect to PostgreSQL.');
}

export const pool = new Pool({ connectionString });

pool.on('error', (error) => {
  console.error('Unexpected error on idle PostgreSQL client.', error);
});
