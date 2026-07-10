import { getCurrentUser } from './_auth.js';
import { getErrorMessage, getPool } from '../server/db.js';
import { canViewRestrictedCategories, RESTRICTED_CATEGORY_NAMES, } from '../server/restrictedCategories.js';
function toNumber(value) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
        return 0;
    }
    return numberValue;
}
export default async function handler(req, res) {
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
        const user = await getCurrentUser(req);
        const showRestrictedCategories = canViewRestrictedCategories(user);
        const restrictedFilterSql = showRestrictedCategories
            ? ''
            : `
                  AND NOT (
                      LOWER(REPLACE(TRIM(category), 'ё', 'е')) = ANY($1::text[])
                  )
              `;
        const queryParams = showRestrictedCategories
            ? []
            : [RESTRICTED_CATEGORY_NAMES];
        const result = await pool.query(`
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
                  ${restrictedFilterSql}
                GROUP BY category
                ORDER BY category ASC
            `, queryParams);
        const categories = result.rows.map((row) => ({
            id: row.name,
            name: row.name,
            image: row.image || '',
            productsCount: toNumber(row.products_count),
        }));
        console.log(`GET /api/categories rows: ${categories.length}`);
        console.log(`GET /api/categories completed in ${Date.now() - startedAt}ms`);
        return res.status(200).json(categories);
    }
    catch (error) {
        console.error('GET /api/categories error:', error);
        return res.status(500).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}
