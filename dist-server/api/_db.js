import { Pool } from 'pg';
let pool = null;
export function getPool() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set');
    }
    if (!pool) {
        const isLocalDatabase = databaseUrl.includes('localhost') ||
            databaseUrl.includes('127.0.0.1');
        pool = new Pool({
            connectionString: databaseUrl,
            max: 2,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 5000,
            query_timeout: 5000,
            statement_timeout: 5000,
            keepAlive: true,
            ssl: isLocalDatabase
                ? false
                : {
                    rejectUnauthorized: false,
                },
        });
        pool.on('error', (error) => {
            console.error('PostgreSQL pool error:', error);
        });
    }
    return pool;
}
