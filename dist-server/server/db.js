import { Pool } from 'pg';
let pool = null;
export function getPool() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL не задан в переменных окружения Vercel');
    }
    if (!pool) {
        pool = new Pool({
            connectionString: databaseUrl,
            ssl: {
                rejectUnauthorized: false,
            },
            max: Number(process.env.PG_POOL_MAX || 5),
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 10_000,
        });
    }
    return pool;
}
export function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
