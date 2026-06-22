import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import cors from 'cors';

dotenv.config();

console.log('=== ЗАПУЩЕН НОВЫЙ SERVER.TS С NEON ===');
console.log('CWD:', process.cwd());
console.log('DATABASE_URL EXISTS:', Boolean(process.env.DATABASE_URL));

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL не задан в .env');
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false,
    },
});

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

interface ProductResponse {
    id: number;
    name: string;
    category: string;
    barcode: string;
    purchasePrice: number;
    sellingPrice: number;
    unit: ProductUnit;
    stock: number;
    minStock: number;
    image: string;
}

interface CountRow {
    count: string;
}

interface DebugDbInfoRow {
    database: string;
    user: string;
    host: string | null;
    port: number;
}

interface CategoryCountRow {
    category: string | null;
    count: string;
}

interface CategoryRow {
    id: string;
    name: string;
    image: string | null;
    products_count: string;
}

interface ProductPreviewRow {
    id: number;
    name: string;
    category: string;
    barcode: string;
    purchase_price: string;
    selling_price: string;
    unit: string;
    stock: string;
    min_stock: string;
    image_url_preview: string | null;
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

    const blobBaseUrl = process.env.BLOB_PUBLIC_BASE_URL;

    if (blobBaseUrl && value.startsWith('/products/')) {
        return `${blobBaseUrl}${value}`;
    }

    if (blobBaseUrl && value.startsWith('products/')) {
        return `${blobBaseUrl}/${value}`;
    }

    return value;
}

function mapProduct(row: ProductDbRow): ProductResponse {
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

app.get('/api/whoami', (_req, res) => {
    res.json({
        server: 'new-server-ts-neon-version',
        time: new Date().toISOString(),
        databaseUrlExists: Boolean(process.env.DATABASE_URL),
        blobBaseUrlExists: Boolean(process.env.BLOB_PUBLIC_BASE_URL),
        cwd: process.cwd(),
    });
});

app.get('/api/health', async (_req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');

        res.json({
            status: 'ok',
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error('GET /api/health error:', error);

        res.status(500).json({
            message: 'Ошибка подключения к БД',
            error: getErrorMessage(error),
        });
    }
});

app.get('/api/debug/db', async (_req, res) => {
    try {
        const dbInfo = await pool.query<DebugDbInfoRow>(`
            SELECT 
                current_database() AS database,
                current_user AS user,
                inet_server_addr() AS host,
                inet_server_port() AS port
        `);

        const productsCount = await pool.query<CountRow>(`
            SELECT COUNT(*) AS count
            FROM products
        `);

        const categoriesCount = await pool.query<CategoryCountRow>(`
            SELECT 
                category,
                COUNT(*) AS count
            FROM products
            GROUP BY category
            ORDER BY COUNT(*) DESC
        `);

        const sampleProducts = await pool.query<ProductPreviewRow>(`
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
                LEFT(image_url, 120) AS image_url_preview
            FROM products
            ORDER BY id DESC
            LIMIT 5
        `);

        res.json({
            db: dbInfo.rows[0],
            productsCount: Number(productsCount.rows[0].count),
            categories: categoriesCount.rows,
            sampleProducts: sampleProducts.rows,
        });
    } catch (error) {
        console.error('GET /api/debug/db error:', error);

        res.status(500).json({
            message: 'Debug error',
            error: getErrorMessage(error),
        });
    }
});

app.get('/api/products', async (_req, res) => {
    try {
        const result = await pool.query<ProductDbRow>(`
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

        res.json(result.rows.map(mapProduct));
    } catch (error) {
        console.error('GET /api/products error:', error);

        res.status(500).json({
            message: 'Ошибка при получении товаров',
            error: getErrorMessage(error),
        });
    }
});

app.get('/api/categories', async (_req, res) => {
    try {
        const result = await pool.query<CategoryRow>(`
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

        res.json(result.rows.map(row => ({
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
});

app.get('/api/categories/:category/products', async (req, res) => {
    try {
        const { category } = req.params;

        const result = await pool.query<ProductDbRow>(`
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

        res.json(result.rows.map(mapProduct));
    } catch (error) {
        console.error('GET /api/categories/:category/products error:', error);

        res.status(500).json({
            message: 'Ошибка при получении товаров категории',
            error: getErrorMessage(error),
        });
    }
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});