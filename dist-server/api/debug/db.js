import { getErrorMessage, getPool } from '../../server/db.js';
import { allowMethods, applyCors, setNoStore } from '../../server/http.js';
export default async function handler(req, res) {
    if (applyCors(req, res))
        return;
    setNoStore(res);
    if (allowMethods(req, res, ['GET']))
        return;
    try {
        const pool = getPool();
        const dbInfo = await pool.query(`
            SELECT 
                current_database() AS database,
                current_user AS user,
                inet_server_addr() AS host,
                inet_server_port() AS port
        `);
        const productsCount = await pool.query(`
            SELECT COUNT(*) AS count
            FROM products
        `);
        const categoriesCount = await pool.query(`
            SELECT 
                category,
                COUNT(*) AS count
            FROM products
            GROUP BY category
            ORDER BY COUNT(*) DESC
        `);
        const sampleProducts = await pool.query(`
            SELECT
                id,
                name,
                category,
                barcode,
                purchase_price,
                selling_price,
                unit,
                stock,
                min_stock,
                LEFT(COALESCE(image_url, ''), 120) AS image_url_preview
            FROM products
            ORDER BY id DESC
            LIMIT 5
        `);
        res.status(200).json({
            db: dbInfo.rows[0],
            productsCount: Number(productsCount.rows[0].count),
            categories: categoriesCount.rows,
            sampleProducts: sampleProducts.rows,
        });
    }
    catch (error) {
        console.error('GET /api/debug/db error:', error);
        res.status(500).json({
            message: 'Debug error',
            error: getErrorMessage(error),
        });
    }
}
