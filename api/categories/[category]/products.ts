import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../_auth.js';
import { getErrorMessage, getPool } from '../../../server/db.js';
import {
    canViewRestrictedCategories,
    isRestrictedCategory,
    RESTRICTED_CATEGORY_NAMES,
} from '../../../server/restrictedCategories.js';

interface ProductRow {
    id: number;
    name: string;
    category: string | null;
    barcode: string | null;
    purchase_price: number | string | null;
    selling_price: number | string | null;
    unit: string | null;
    stock: number | string | null;
    min_stock: number | string | null;
    image: string | null;
}

function toNumber(value: unknown): number {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        return 0;
    }

    return numberValue;
}

function getQueryValue(value: unknown): string {
    if (Array.isArray(value)) {
        return String(value[0] ?? '');
    }

    return String(value ?? '');
}

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
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

    const rawCategory =
        getQueryValue(req.query.category) ||
        getQueryValue(req.query.categoryName) ||
        getQueryValue(req.query.categoryId);

    const category = safeDecode(rawCategory).trim();

    if (!category) {
        return res.status(400).json({
            success: false,
            message: 'Category is required',
        });
    }

    const user = await getCurrentUser(req);
    const showRestrictedCategories = canViewRestrictedCategories(user);

    if (isRestrictedCategory(category) && !showRestrictedCategories) {
        console.warn(`Restricted category blocked: ${category}`);

        return res.status(200).json([]);
    }

    const startedAt = Date.now();

    try {
        console.log(`GET /api/categories/${category}/products started`);

        const pool = getPool();

        const restrictedFilterSql = showRestrictedCategories
            ? ''
            : `
                  AND NOT (
                      LOWER(REPLACE(TRIM(category), 'ё', 'е')) = ANY($2::text[])
                  )
              `;

        const queryParams = showRestrictedCategories
            ? [category]
            : [category, RESTRICTED_CATEGORY_NAMES];

        const result = await pool.query<ProductRow>(
            `
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
                    image_url AS image
                FROM products
                WHERE stock > 0
                  AND category = $1
                  ${restrictedFilterSql}
                ORDER BY id ASC
            `,
            queryParams
        );

        const products = result.rows.map((row) => ({
            id: Number(row.id),
            name: row.name,
            category: row.category || '',
            barcode: row.barcode || '',
            purchasePrice: toNumber(row.purchase_price),
            sellingPrice: toNumber(row.selling_price),
            unit: row.unit === 'weight' ? 'weight' : 'piece',
            stock: Math.floor(toNumber(row.stock)),
            minStock: Math.floor(toNumber(row.min_stock)),
            image: row.image || '',
        }));

        console.log(`GET /api/categories/${category}/products rows: ${products.length}`);
        console.log(`GET /api/categories/${category}/products completed in ${Date.now() - startedAt}ms`);

        return res.status(200).json(products);
    } catch (error) {
        console.error(`GET /api/categories/${category}/products error:`, error);

        return res.status(500).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}