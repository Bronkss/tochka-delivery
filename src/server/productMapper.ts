export type ProductUnit = 'piece' | 'weight';

export interface ProductDbRow {
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

export interface ProductResponse {
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

function toProductUnit(value: unknown): ProductUnit {
    return value === 'weight' ? 'weight' : 'piece';
}

export function normalizeImageUrl(imageUrl: string | null | undefined): string {
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

export function mapProduct(row: ProductDbRow): ProductResponse {
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