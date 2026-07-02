import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage, getPool } from '../server/db.js';
import { RESTRICTED_CATEGORY_NAMES } from '../server/restrictedCategories.js';

interface CategoryRow {
    name: string;
    image: string | null;
    products_count: number | string;
}

function toNumber(value: unknown): number {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        return 0;
    }

    return numberValue;
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }

    const startedAt = Date.now();

    try {
        console.log('GET /api/categories started');

        const pool = getPool();

        const result = await pool.query<CategoryRow>(
            `
                SELECT
                    category AS name,
                    COALESCE(
                        MIN(NULLIF(image_url, '')),
                        ''
                    ) AS image,
                    COUNT(*)::int AS products_count
                FROM products
                WHERE stock > 0
                  AND category IS NOT NULL
                  AND TRIM(category) <> ''
                  AND NOT (
                      LOWER(REPLACE(TRIM(category), 'ё', 'е')) = ANY($1::text[])
                  )
                GROUP BY category
                ORDER BY category ASC
            `,
            [RESTRICTED_CATEGORY_NAMES]
        );

        const categories = result.rows.map((row) => ({
            id: row.name,
            name: row.name,
            image: row.image || '',
            productsCount: toNumber(row.products_count),
        }));

        console.log(`GET /api/categories rows: ${categories.length}`);
        console.log(`GET /api/categories completed in ${Date.now() - startedAt}ms`);

        return res.status(200).json(categories);
    } catch (error) {
        console.error('GET /api/categories error:', error);

        return res.status(500).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}