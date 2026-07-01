import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import productsHandler from './api/products.js';
import categoriesHandler from './api/categories.js';
import categoryProductsHandler from './api/categories/[category]/products.js';

import ordersHandler from './api/orders.js';

import authRegisterHandler from './api/auth/register.js';
import authLoginHandler from './api/auth/login.js';
import authMeHandler from './api/auth/me.js';
import authLogoutHandler from './api/auth/logout.js';

import userOrdersHandler from './api/user/orders.js';

import telegramWebhookHandler from './api/telegram-webhook.js';
import setTelegramWebhookHandler from './api/set-telegram-webhook.js';

import healthHandler from './api/health.js';
import pingHandler from './api/ping.js';
import whoamiHandler from './api/whoami.js';
import dbTestHandler from './api/db-test.js';
import debugDbHandler from './api/debug/db.js';

dotenv.config();

type ApiHandler = (req: any, res: any) => void | Promise<void>;

const app = express();
const PORT = Number(process.env.PORT || 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDistPath = path.resolve(__dirname, '../dist');

app.set('trust proxy', 1);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

function setQuery(
    req: express.Request,
    extraQuery: Record<string, unknown>
) {
    Object.defineProperty(req, 'query', {
        value: {
            ...req.query,
            ...extraQuery,
        },
        configurable: true,
    });
}

function wrapHandler(
    handler: ApiHandler,
    getExtraQuery?: (req: express.Request) => Record<string, unknown>
) {
    return async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        try {
            if (getExtraQuery) {
                setQuery(req, getExtraQuery(req));
            }

            await handler(req as any, res as any);
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Health / debug
 */
app.all('/api/health', wrapHandler(healthHandler));
app.all('/api/ping', wrapHandler(pingHandler));
app.all('/api/whoami', wrapHandler(whoamiHandler));
app.all('/api/db-test', wrapHandler(dbTestHandler));
app.all('/api/debug/db', wrapHandler(debugDbHandler));

/**
 * Products / categories
 */
app.all('/api/products', wrapHandler(productsHandler));
app.all('/api/categories', wrapHandler(categoriesHandler));

app.all(
    '/api/categories/:category/products',
    wrapHandler(categoryProductsHandler, (req) => ({
        category: req.params.category,
    }))
);

/**
 * Orders
 */
app.all('/api/orders', wrapHandler(ordersHandler));

/**
 * Auth
 */
app.all('/api/auth/register', wrapHandler(authRegisterHandler));
app.all('/api/auth/login', wrapHandler(authLoginHandler));
app.all('/api/auth/me', wrapHandler(authMeHandler));
app.all('/api/auth/logout', wrapHandler(authLogoutHandler));

/**
 * User account
 */
app.all('/api/user/orders', wrapHandler(userOrdersHandler));

/**
 * Telegram
 */
app.all('/api/telegram-webhook', wrapHandler(telegramWebhookHandler));
app.all('/api/set-telegram-webhook', wrapHandler(setTelegramWebhookHandler));

/**
 * API fallback
 */
app.use('/api', (_req, res) => {
    res.status(404).json({
        success: false,
        message: 'API-метод не найден',
    });
});

/**
 * Static React build
 */
app.use(express.static(frontendDistPath));

/**
 * React Router fallback.
 * Это главное, чтобы работали прямые ссылки:
 * /auth
 * /account
 * /search
 * /category/...
 */
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    if (req.path.startsWith('/api')) {
        return next();
    }

    return res.sendFile(path.join(frontendDistPath, 'index.html'));
});

/**
 * Error handler
 */
app.use((
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
) => {
    console.error('Server error:', error);

    if (res.headersSent) {
        return;
    }

    res.status(500).json({
        success: false,
        message: error instanceof Error
            ? error.message
            : 'Внутренняя ошибка сервера',
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Frontend path: ${frontendDistPath}`);
});