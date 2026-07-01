import type { VercelRequest, VercelResponse } from '@vercel/node';

import { getPool } from '../_db.js';
import { createUserSession, hashPassword } from '../_auth.js';

interface RegisterBody {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
}

function getBody<T>(req: VercelRequest): T {
    if (typeof req.body === 'string') {
        return JSON.parse(req.body) as T;
    }

    return req.body as T;
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
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
        const body = getBody<RegisterBody>(req);

        const email = normalizeEmail(body.email ?? '');
        const password = body.password ?? '';
        const name = body.name?.trim() || null;
        const phone = body.phone?.trim() || null;

        if (!email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Введите корректный email',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Пароль должен быть минимум 6 символов',
            });
        }

        const pool = getPool();

        const existingUser = await pool.query(
            `
                SELECT id
                FROM users
                WHERE email = $1
                LIMIT 1
            `,
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Пользователь с таким email уже существует',
            });
        }

        const passwordHash = hashPassword(password);

        const result = await pool.query(
            `
                INSERT INTO users (
                    email,
                    password_hash,
                    name,
                    phone
                )
                VALUES ($1, $2, $3, $4)
                RETURNING id, email, name, phone
            `,
            [email, passwordHash, name, phone]
        );

        const user = result.rows[0];

        await createUserSession(user.id, res);

        return res.status(201).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Register error:', error);

        return res.status(500).json({
            success: false,
            message: 'Ошибка регистрации',
        });
    }
}