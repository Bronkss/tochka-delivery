import { getErrorMessage, getPool, getSafeDatabaseInfo } from '../server/db.js';
function withTimeout(promise, timeoutMs, message) {
    return Promise.race([
        promise,
        new Promise((_resolve, reject) => {
            setTimeout(() => {
                reject(new Error(message));
            }, timeoutMs);
        }),
    ]);
}
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }
    const databaseInfo = getSafeDatabaseInfo();
    try {
        const pool = getPool();
        const result = await withTimeout(pool.query('SELECT now() as now, current_database() as database_name'), 7000, 'Database connection timeout after 7 seconds');
        return res.status(200).json({
            success: true,
            message: 'Database connected',
            databaseInfo,
            result: result.rows[0],
        });
    }
    catch (error) {
        console.error('DB test error:', error);
        return res.status(500).json({
            success: false,
            message: getErrorMessage(error),
            databaseInfo,
        });
    }
}
