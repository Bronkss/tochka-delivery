function toProductUnit(value) {
    return value === 'weight' ? 'weight' : 'piece';
}
export function normalizeImageUrl(imageUrl) {
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
export function mapProduct(row) {
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
