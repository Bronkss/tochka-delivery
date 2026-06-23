import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage, getPool } from '../server/db';
import { allowMethods, applyCors, setNoStore } from '../server/http';

interface HealthRow {
    now: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (applyCors(req, res)) return;

    setNoStore(res);

    if (allowMethods(req, res, ['GET'])) return;

    try {
        const result = await getPool().query<HealthRow>('SELECT NOW() AS now');

        res.status(200).json({
            status: 'ok',
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error('GET /api/health error:', error);

        res.status(500).json({
            message: 'Ошибка подключения к БД',
            error: getErrorMessage(error),
        });
    }
}