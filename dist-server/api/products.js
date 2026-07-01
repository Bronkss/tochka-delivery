import pg from 'pg';
let cachedPool = null;
function getPool() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL не задана');
    }
    if (!cachedPool) {
        cachedPool = new pg.Pool({
            connectionString: databaseUrl,
            ssl: {
                rejectUnauthorized: false,
            },
            max: 5,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 10_000,
        });
    }
    return cachedPool;
}
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function toProductUnit(value) {
    return value === 'weight' ? 'weight' : 'piece';
}
function normalizeImageUrl(imageUrl) {
    if (!imageUrl)
        return '';
    const value = imageUrl.trim();
    if (!value)
        return '';
    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }
    const blobBaseUrl = process.env.BLOB_PUBLIC_BASE_URL?.replace(/\/$/, '');
    if (blobBaseUrl && value.startsWith('/products/')) {
        return `${blobBaseUrl}${value}`;
    }
    if (blobBaseUrl && value.startsWith('products/')) {
        return `${blobBaseUrl}/${value}`;
    }
    return value;
}
function mapProduct(row) {
    return {
        id: Number(row.id),
        name: row.name || '',
        category: row.category || '',
        barcode: row.barcode || '',
        purchasePrice: Number(row.purchase_price ?? 0),
        sellingPrice: Number(row.selling_price ?? 0),
        unit: toProductUnit(row.unit),
        stock: Number(row.stock ?? 0),
        minStock: Number(row.min_stock ?? 0),
        image: normalizeImageUrl(row.image_url || row.image),
    };
}
function json(data, status = 200) {
    return Response.json(data, {
        status,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
export async function GET() {
    try {
        const result = await getPool().query(`
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
        return json(result.rows.map(mapProduct));
    }
    catch (error) {
        console.error('GET /api/products error:', error);
        return json({
            ok: false,
            message: 'Ошибка при получении товаров',
            error: getErrorMessage(error),
        }, 500);
    }
}
