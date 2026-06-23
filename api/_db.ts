import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }

    if (!pool) {
        const isLocalDatabase =
            process.env.DATABASE_URL.includes('localhost') ||
            process.env.DATABASE_URL.includes('127.0.0.1');

        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 1,
            ssl: isLocalDatabase
                ? false
                : {
                    rejectUnauthorized: false,
                },
        });
    }

    return pool;
}