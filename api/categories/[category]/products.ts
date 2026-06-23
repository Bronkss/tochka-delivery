import pg from 'pg';

type ProductUnit = 'piece' | 'weight';

interface ProductDbRow {
    id: number | string;
    name?: string | null;
    category?: string | null;
    barcode?: string | null;
    purchase_price?: number | string | null;
    selling_price?: number | string | null;
    min_stock?: number | string | null;
    unit?: ProductUnit | string | null;
    stock?: number | string | null;
    image?: string | null;
    image_url?: string | null;
}

let cachedPool: pg.Pool | null = null;

function getPool(): pg.Pool {
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

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function toProductUnit(value: unknown): ProductUnit {
    return value === 'weight' ? 'weight' : 'piece';
}

function normalizeImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return '';

    const value = imageUrl.trim();

    if (!value) return '';

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

function mapProduct(row: ProductDbRow) {
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

function json(data: unknown, status = 200): Response {
    return Response.json(data, {
        status,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}

function getCategoryFromRequest(request: Request): string {
    const url = new URL(request.url);

    const fromQuery = url.searchParams.get('category');

    if (fromQuery) {
        return fromQuery;
    }

    const match = url.pathname.match(/^\/api\/categories\/(.+)\/products$/);

    if (!match?.[1]) {
        return '';
    }

    return decodeURIComponent(match[1]);
}

export async function GET(request: Request) {
    try {
        const category = getCategoryFromRequest(request).trim();

        if (!category) {
            return json({
                ok: false,
                message: 'Категория не передана',
            }, 400);
        }

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

        return json(result.rows.map(mapProduct));
    } catch (error) {
        console.error('GET /api/categories/[category]/products error:', error);

        return json({
            ok: false,
            message: 'Ошибка при получении товаров категории',
            error: getErrorMessage(error),
        }, 500);
    }
}