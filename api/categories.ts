import pg from 'pg';

interface CategoryRow {
    id: string;
    name: string;
    image: string | null;
    products_count: string;
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

function json(data: unknown, status = 200): Response {
    return Response.json(data, {
        status,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}

export async function GET() {
    try {
        const result = await getPool().query<CategoryRow>(`
            WITH category_counts AS (
                SELECT 
                    category AS name,
                    COUNT(*) AS products_count
                FROM products
                WHERE category IS NOT NULL 
                  AND TRIM(category) <> ''
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

        return json(result.rows.map(row => ({
            id: row.id,
            name: row.name,
            image: normalizeImageUrl(row.image),
            productsCount: Number(row.products_count),
        })));
    } catch (error) {
        console.error('GET /api/categories error:', error);

        return json({
            ok: false,
            message: 'Ошибка при получении категорий',
            error: getErrorMessage(error),
        }, 500);
    }
}