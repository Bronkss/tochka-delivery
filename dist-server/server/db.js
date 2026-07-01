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
export function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Unknown error';
}
export function getSafeDatabaseInfo() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        return {
            exists: false,
            host: null,
            database: null,
        };
    }
    try {
        const url = new URL(databaseUrl);
        return {
            exists: true,
            host: url.hostname,
            port: url.port || '5432',
            database: url.pathname.replace('/', ''),
            username: url.username,
            sslmode: url.searchParams.get('sslmode'),
        };
    }
    catch {
        return {
            exists: true,
            host: 'failed_to_parse',
            database: null,
        };
    }
}
