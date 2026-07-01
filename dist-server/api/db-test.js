// api/db-test.ts
let cachedPool = null;
function json(data, status = 200) {
    return Response.json(data, {
        status,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
export async function GET() {
    try {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            return json({
                ok: false,
                step: 'env',
                message: 'DATABASE_URL не найдена в Vercel Environment Variables',
            }, 500);
        }
        const pg = await import('pg');
        if (!cachedPool) {
            cachedPool = new pg.Pool({
                connectionString: databaseUrl,
                ssl: {
                    rejectUnauthorized: false,
                },
                max: 5,
            });
        }
        const nowResult = await cachedPool.query('SELECT NOW() AS now');
        const productsCountResult = await cachedPool.query(`
            SELECT COUNT(*) AS count
            FROM products
        `);
        return json({
            ok: true,
            step: 'db',
            time: nowResult.rows[0].now,
            productsCount: Number(productsCountResult.rows[0].count),
        });
    }
    catch (error) {
        return json({
            ok: false,
            step: 'catch',
            error: getErrorMessage(error),
        }, 500);
    }
}
