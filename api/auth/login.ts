import type { VercelRequest, VercelResponse } from '@vercel/node';

import { getPool } from '../_db.js';
import { createUserSession, verifyPassword } from '../_auth.js';

interface LoginBody {
    email?: string;
    password?: string;
}

function getBody<T>(req: VercelRequest): T {
    if (typeof req.body === 'string') {
        return JSON.parse(req.body) as T;
    }

    return req.body as T;
}

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
        const body = getBody<LoginBody>(req);

        const email = String(body.email ?? '').trim().toLowerCase();
        const password = String(body.password ?? '');

        const pool = getPool();

        const result = await pool.query(
            `
                SELECT
                    id,
                    email,
                    password_hash,
                    name,
                    phone,
                    COALESCE(is_vip, false) AS "isVip"
                FROM users
                WHERE email = $1
                LIMIT 1
            `,
            [email]
        );

        const user = result.rows[0];

        if (!user || !verifyPassword(password, user.password_hash)) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль',
            });
        }

        await createUserSession(user.id, res);

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                isVip: Boolean(user.isVip),
            },
        });
    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Ошибка входа',
        });
    }
}