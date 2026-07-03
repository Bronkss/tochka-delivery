const ALLOWED_IMAGE_HOST_SUFFIXES = [
    '.public.blob.vercel-storage.com',
    '.blob.vercel-storage.com',
];
const ALLOWED_IMAGE_HOSTS = [
    'public.blob.vercel-storage.com',
    'blob.vercel-storage.com',
];
function getQueryValue(value) {
    if (Array.isArray(value)) {
        return String(value[0] ?? '');
    }
    return String(value ?? '');
}
function isAllowedImageUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:') {
            return false;
        }
        return (ALLOWED_IMAGE_HOSTS.includes(url.hostname) ||
            ALLOWED_IMAGE_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix)));
    }
    catch {
        return false;
    }
}
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }
    const imageUrl = getQueryValue(req.query.url);
    if (!imageUrl || !isAllowedImageUrl(imageUrl)) {
        return res.status(400).json({
            success: false,
            message: 'Некорректный URL изображения',
        });
    }
    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'TochkaDostavkaImageProxy/1.0',
            },
        });
        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: 'Не удалось загрузить изображение',
            });
        }
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        if (!contentType.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: 'URL не является изображением',
            });
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', String(buffer.length));
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        return res.status(200).send(buffer);
    }
    catch (error) {
        console.error('Image proxy error:', error);
        return res.status(500).json({
            success: false,
            message: 'Ошибка загрузки изображения через proxy',
        });
    }
}
