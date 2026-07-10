import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    randomBytes,
    scryptSync,
    timingSafeEqual,
    createHash,
} from 'crypto';

import { getPool } from './_db.js';

export interface AuthUser {
    id: number;
    email: string;
    name: string | null;
    phone: string | null;
    isVip: boolean;
}

const SESSION_COOKIE_NAME = 'rodnik_session';
const SESSION_DAYS = 30;

function getCookie(req: VercelRequest, name: string): string | null {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map(cookie => cookie.trim());

    for (const cookie of cookies) {
        const [key, ...valueParts] = cookie.split('=');

        if (key === name) {
            return decodeURIComponent(valueParts.join('='));
        }
    }

    return null;
}

function getSessionCookieOptions(maxAgeSeconds: number): string {
    const isProduction = process.env.NODE_ENV === 'production';

    return [
        `${SESSION_COOKIE_NAME}=`,
        `Path=/`,
        `HttpOnly`,
        `SameSite=Lax`,
        `Max-Age=${maxAgeSeconds}`,
        isProduction ? 'Secure' : '',
    ]
        .filter(Boolean)
        .join('; ');
}

export function setSessionCookie(res: VercelResponse, token: string) {
    const maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60;

    const cookie = [
        `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
        `Path=/`,
        `HttpOnly`,
        `SameSite=Lax`,
        `Max-Age=${maxAgeSeconds}`,
        process.env.NODE_ENV === 'production' ? 'Secure' : '',
    ]
        .filter(Boolean)
        .join('; ');

    res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res: VercelResponse) {
    res.setHeader('Set-Cookie', getSessionCookieOptions(0));
}

function hashSessionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');

    return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
    const [algorithm, salt, hash] = storedHash.split(':');

    if (algorithm !== 'scrypt' || !salt || !hash) {
        return false;
    }

    const passwordHash = scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(hash, 'hex');

    if (passwordHash.length !== storedBuffer.length) {
        return false;
    }

    return timingSafeEqual(passwordHash, storedBuffer);
}

export async function createUserSession(
    userId: number,
    res: VercelResponse
): Promise<void> {
    const pool = getPool();

    const token = randomBytes(32).toString('hex');
    const tokenHash = hashSessionToken(token);

    await pool.query(
        `
            INSERT INTO user_sessions (
                user_id,
                token_hash,
                expires_at
            )
            VALUES ($1, $2, now() + interval '30 days')
        `,
        [userId, tokenHash]
    );

    setSessionCookie(res, token);
}

export async function getCurrentUser(
    req: VercelRequest
): Promise<AuthUser | null> {
    const token = getCookie(req, SESSION_COOKIE_NAME);

    if (!token) {
        return null;
    }

    const tokenHash = hashSessionToken(token);
    const pool = getPool();

    const result = await pool.query<AuthUser>(
        `
            SELECT
                users.id,
                users.email,
                users.name,
                users.phone,
                COALESCE(users.is_vip, false) AS "isVip"
            FROM user_sessions
            JOIN users ON users.id = user_sessions.user_id
            WHERE user_sessions.token_hash = $1
              AND user_sessions.expires_at > now()
            LIMIT 1
        `,
        [tokenHash]
    );

    return result.rows[0] ?? null;
}

export async function requireUser(req: VercelRequest): Promise<AuthUser> {
    const user = await getCurrentUser(req);

    if (!user) {
        throw new Error('UNAUTHORIZED');
    }

    return user;
}

export async function deleteCurrentSession(req: VercelRequest): Promise<void> {
    const token = getCookie(req, SESSION_COOKIE_NAME);

    if (!token) return;

    const tokenHash = hashSessionToken(token);
    const pool = getPool();

    await pool.query(
        `
            DELETE FROM user_sessions
            WHERE token_hash = $1
        `,
        [tokenHash]
    );
}