import type { VercelRequest, VercelResponse } from '@vercel/node';

function getAllowedOrigins(): string[] {
    const raw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || '';

    return raw
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
}

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();

    if (origin) {
        const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);

        if (isAllowed) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
        }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return true;
    }

    return false;
}

export function setNoStore(res: VercelResponse): void {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
}

export function allowMethods(
    req: VercelRequest,
    res: VercelResponse,
    methods: string[],
): boolean {
    if (!req.method || !methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '));

        res.status(405).json({
            message: `Метод ${req.method} не поддерживается`,
        });

        return true;
    }

    return false;
}