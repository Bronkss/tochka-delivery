import type { VercelRequest, VercelResponse } from '@vercel/node';

import { clearSessionCookie, deleteCurrentSession } from '../_auth.js';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }

    try {
        await deleteCurrentSession(req);
        clearSessionCookie(res);

        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error('Logout error:', error);

        return res.status(500).json({
            success: false,
            message: 'Ошибка выхода',
        });
    }
}