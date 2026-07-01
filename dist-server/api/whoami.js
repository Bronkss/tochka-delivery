import { allowMethods, applyCors, setNoStore } from '../server/http.js';
export default function handler(req, res) {
    if (applyCors(req, res))
        return;
    setNoStore(res);
    if (allowMethods(req, res, ['GET']))
        return;
    res.status(200).json({
        server: 'vercel-functions-neon-version',
        time: new Date().toISOString(),
        databaseUrlExists: Boolean(process.env.DATABASE_URL),
        blobBaseUrlExists: Boolean(process.env.BLOB_PUBLIC_BASE_URL),
        allowedOriginsExists: Boolean(process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN),
        vercel: Boolean(process.env.VERCEL),
        nodeEnv: process.env.NODE_ENV,
    });
}
