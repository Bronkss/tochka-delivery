import { getErrorMessage, getPool } from '../server/db.js';
import { allowMethods, applyCors, setNoStore } from '../server/http.js';
export default async function handler(req, res) {
    if (applyCors(req, res))
        return;
    setNoStore(res);
    if (allowMethods(req, res, ['GET']))
        return;
    try {
        const result = await getPool().query('SELECT NOW() AS now');
        res.status(200).json({
            status: 'ok',
            time: result.rows[0].now,
        });
    }
    catch (error) {
        console.error('GET /api/health error:', error);
        res.status(500).json({
            message: 'Ошибка подключения к БД',
            error: getErrorMessage(error),
        });
    }
}
