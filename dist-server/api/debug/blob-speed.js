const ALLOWED_HOSTS = [
    'public.blob.vercel-storage.com',
    'blob.vercel-storage.com',
];
function getQueryValue(value) {
    if (Array.isArray(value)) {
        return String(value[0] ?? '');
    }
    return String(value ?? '');
}
function isAllowedUrl(value) {
    try {
        const url = new URL(value);
        return (url.protocol === 'https:' &&
            ALLOWED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)));
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
    const url = getQueryValue(req.query.url);
    if (!url || !isAllowedUrl(url)) {
        return res.status(400).json({
            success: false,
            message: 'Передай корректный url картинки из Vercel Blob',
        });
    }
    const startedAt = Date.now();
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'AMVERA-Blob-Speed-Test/1.0',
            },
        });
        const headersReceivedAt = Date.now();
        const arrayBuffer = await response.arrayBuffer();
        const completedAt = Date.now();
        const sizeBytes = arrayBuffer.byteLength;
        const totalMs = completedAt - startedAt;
        const downloadMs = completedAt - headersReceivedAt;
        return res.status(200).json({
            success: true,
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type'),
            sizeBytes,
            sizeMb: Number((sizeBytes / 1024 / 1024).toFixed(2)),
            timeToHeadersMs: headersReceivedAt - startedAt,
            downloadMs,
            totalMs,
            speedMbps: Number(((sizeBytes * 8) / 1024 / 1024 / (totalMs / 1000)).toFixed(2)),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Ошибка проверки',
            totalMs: Date.now() - startedAt,
        });
    }
}
