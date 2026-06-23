import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage, getPool } from '../server/db';
import { allowMethods, applyCors, setNoStore } from '../server/http';
import { normalizeImageUrl } from '../server/productMapper';

interface CategoryRow {
    id: string;
    name: string;
    image: string | null;
    products_count: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (applyCors(req, res)) return;

    setNoStore(res);

    if (allowMethods(req, res, ['GET'])) return;

    try {
        const result = await getPool().query<CategoryRow>(`
            WITH category_counts AS (
                SELECT 
                    category AS name,
                    COUNT(*) AS products_count
                FROM products
                WHERE category IS NOT NULL AND TRIM(category) <> ''
                GROUP BY category
            ),
            category_images AS (
                SELECT DISTINCT ON (category)
                    category AS name,
                    image_url AS image
                FROM products
                WHERE category IS NOT NULL
                  AND TRIM(category) <> ''
                  AND image_url IS NOT NULL
                  AND TRIM(image_url) <> ''
                ORDER BY category, id DESC
            )
            SELECT
                category_counts.name AS id,
                category_counts.name AS name,
                category_images.image,
                category_counts.products_count
            FROM category_counts
            LEFT JOIN category_images
                ON category_images.name = category_counts.name
            ORDER BY category_counts.name ASC
        `);

        res.status(200).json(result.rows.map(row => ({
            id: row.id,
            name: row.name,
            image: normalizeImageUrl(row.image),
            productsCount: Number(row.products_count),
        })));
    } catch (error) {
        console.error('GET /api/categories error:', error);

        res.status(500).json({
            message: 'Ошибка при получении категорий',
            error: getErrorMessage(error),
        });
    }
}