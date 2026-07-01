import { getErrorMessage, getPool } from '../../../server/db.js';
function toNumber(value) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
        return 0;
    }
    return numberValue;
}
function getQueryValue(value) {
    if (Array.isArray(value)) {
        return String(value[0] ?? '');
    }
    return String(value ?? '');
}
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }
    const category = getQueryValue(req.query.category) ||
        getQueryValue(req.query.categoryName) ||
        getQueryValue(req.query.categoryId);
    if (!category.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Category is required',
        });
    }
    const startedAt = Date.now();
    try {
        console.log(`GET /api/categories/${category}/products started`);
        const pool = getPool();
        const result = await pool.query(`
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
                ORDER BY id ASC
            `, [category]);
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
    }
    catch (error) {
        console.error(`GET /api/categories/${category}/products error:`, error);
        return res.status(500).json({
            success: false,
            message: getErrorMessage(error),
        });
    }
}
