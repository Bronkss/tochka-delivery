import type { VercelRequest, VercelResponse } from '@vercel/node';

import { getCurrentUser } from '../_auth.js';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }

    try {
        const user = await getCurrentUser(req);

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Me error:', error);

        return res.status(500).json({
            success: false,
            message: 'Ошибка получения пользователя',
        });
    }
}