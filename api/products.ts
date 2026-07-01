import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage, getPool } from '../server/db.js';

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
        console.log('GET /api/products started');

        const pool = getPool();

        const result = await pool.query<ProductRow>(`
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
            ORDER BY id ASC
        `);

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

        console.log(`GET /api/products rows: ${products.length}`);
        console.log(`GET /api/products completed in ${Date.now() - startedAt}ms`);

        return res.status(200).json(products);
    } catch (error) {
        console.error('GET /api/products error:', error);

        return res.status(500).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}