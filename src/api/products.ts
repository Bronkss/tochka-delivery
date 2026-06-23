import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage, getPool } from '../server/db';
import { allowMethods, applyCors, setNoStore } from '../server/http';
import { mapProduct, type ProductDbRow } from '../server/productMapper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (applyCors(req, res)) return;

    setNoStore(res);

    if (allowMethods(req, res, ['GET'])) return;

    try {
        const result = await getPool().query<ProductDbRow>(`
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
                image_url
            FROM products
            ORDER BY id DESC
        `);

        res.status(200).json(result.rows.map(mapProduct));
    } catch (error) {
        console.error('GET /api/products error:', error);

        res.status(500).json({
            message: 'Ошибка при получении товаров',
            error: getErrorMessage(error),
        });
    }
}