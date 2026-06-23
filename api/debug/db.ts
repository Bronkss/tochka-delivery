import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage, getPool } from '../../server/db';
import { allowMethods, applyCors, setNoStore } from '../../server/http';

interface CountRow {
    count: string;
}

interface DebugDbInfoRow {
    database: string;
    user: string;
    host: string | null;
    port: number;
}

interface CategoryCountRow {
    category: string | null;
    count: string;
}

interface ProductPreviewRow {
    id: number;
    name: string;
    category: string;
    barcode: string;
    purchase_price: string;
    selling_price: string;
    unit: string;
    stock: string;
    min_stock: string;
    image_url_preview: string | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (applyCors(req, res)) return;

    setNoStore(res);

    if (allowMethods(req, res, ['GET'])) return;

    try {
        const pool = getPool();

        const dbInfo = await pool.query<DebugDbInfoRow>(`
            SELECT 
                current_database() AS database,
                current_user AS user,
                inet_server_addr() AS host,
                inet_server_port() AS port
        `);

        const productsCount = await pool.query<CountRow>(`
            SELECT COUNT(*) AS count
            FROM products
        `);

        const categoriesCount = await pool.query<CategoryCountRow>(`
            SELECT 
                category,
                COUNT(*) AS count
            FROM products
            GROUP BY category
            ORDER BY COUNT(*) DESC
        `);

        const sampleProducts = await pool.query<ProductPreviewRow>(`
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
    } catch (error) {
        console.error('GET /api/debug/db error:', error);

        res.status(500).json({
            message: 'Debug error',
            error: getErrorMessage(error),
        });
    }
}