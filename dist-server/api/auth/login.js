import { getPool } from '../_db.js';
import { createUserSession, verifyPassword } from '../_auth.js';
function getBody(req) {
    if (typeof req.body === 'string') {
        return JSON.parse(req.body);
    }
    return req.body;
}
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }
    try {
        const body = getBody(req);
        const email = String(body.email ?? '').trim().toLowerCase();
        const password = String(body.password ?? '');
        const pool = getPool();
        const result = await pool.query(`
                SELECT
                    id,
                    email,
                    password_hash,
                    name,
                    phone
                FROM users
                WHERE email = $1
                LIMIT 1
            `, [email]);
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
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Ошибка входа',
        });
    }
}
