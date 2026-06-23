import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
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

export function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}