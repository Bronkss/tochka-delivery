import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage, getPool } from '../../../server/db';
import { allowMethods, applyCors, setNoStore } from '../../../server/http';
import { mapProduct, type ProductDbRow } from '../../../server/productMapper';

function getCategory(req: VercelRequest): string {
    const raw = req.query.category;

    if (Array.isArray(raw)) {
        return raw[0] || '';
    }

    return typeof raw === 'string' ? raw : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (applyCors(req, res)) return;

    setNoStore(res);

    if (allowMethods(req, res, ['GET'])) return;

    const category = getCategory(req);

    if (!category.trim()) {
        res.status(400).json({
            message: 'Категория не передана',
        });

        return;
    }

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
            WHERE LOWER(TRIM(category)) = LOWER(TRIM($1))
            ORDER BY id DESC
        `, [category]);

        res.status(200).json(result.rows.map(mapProduct));
    } catch (error) {
        console.error('GET /api/categories/:category/products error:', error);

        res.status(500).json({
            message: 'Ошибка при получении товаров категории',
            error: getErrorMessage(error),
        });
    }
}