const VERCEL_BLOB_HOST_SUFFIXES = [
    '.public.blob.vercel-storage.com',
    '.blob.vercel-storage.com',
];

const VERCEL_BLOB_HOSTS = [
    'public.blob.vercel-storage.com',
    'blob.vercel-storage.com',
];

const PRODUCT_PLACEHOLDER = '/product-placeholder.png';

export function getImageUrl(image?: string): string {
    const value = image?.trim();

    if (!value) {
        return PRODUCT_PLACEHOLDER;
    }

    try {
        const url = new URL(value);

        const isVercelBlobImage =
            VERCEL_BLOB_HOSTS.includes(url.hostname) ||
            VERCEL_BLOB_HOST_SUFFIXES.some((suffix) =>
                url.hostname.endsWith(suffix)
            );

        if (isVercelBlobImage) {
            return `/api/image-proxy?url=${encodeURIComponent(value)}`;
        }

        return value;
    } catch {
        return value || PRODUCT_PLACEHOLDER;
    }
}