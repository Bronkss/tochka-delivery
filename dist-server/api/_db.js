import { Pool } from 'pg';
let pool = null;
export function getPool() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }
    if (!pool) {
        const isLocalDatabase = process.env.DATABASE_URL.includes('localhost') ||
            process.env.DATABASE_URL.includes('127.0.0.1');
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 3,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 30000,
            ssl: isLocalDatabase
                ? false
                : {
                    rejectUnauthorized: false,
                },
        });
    }
    return pool;
}
export function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Unknown error';
}
