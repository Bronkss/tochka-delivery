import dns from 'node:dns';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dns.setDefaultResultOrder('ipv4first');

import * as productsModule from './api/products.js';
import * as categoriesModule from './api/categories.js';
import * as categoryProductsModule from './api/categories/[category]/products.js';

import * as ordersModule from './api/orders.js';

import * as authRegisterModule from './api/auth/register.js';
import * as authLoginModule from './api/auth/login.js';
import * as authMeModule from './api/auth/me.js';
import * as authLogoutModule from './api/auth/logout.js';

import * as userOrdersModule from './api/user/orders.js';

import * as telegramWebhookModule from './api/telegram-webhook.js';
import * as setTelegramWebhookModule from './api/set-telegram-webhook.js';

import * as healthModule from './api/health.js';
import * as pingModule from './api/ping.js';
import * as whoamiModule from './api/whoami.js';
import * as dbTestModule from './api/db-test.js';
import * as debugDbModule from './api/debug/db.js';

dotenv.config();

type ApiHandler = (req: any, res: any) => unknown | Promise<unknown>;

const app = express();
const PORT = Number(process.env.PORT || 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDistPath = path.resolve(__dirname, '../dist');

app.set('trust proxy', 1);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

function resolveHandler(moduleName: string, module: Record<string, unknown>): ApiHandler {
    const handler =
        module.default ||
        module.handler ||
        module.GET ||
        module.POST ||
        Object.values(module).find((value) => typeof value === 'function');

    if (typeof handler !== 'function') {
        throw new Error(`В модуле ${moduleName} не найден API handler`);
    }

    return handler as ApiHandler;
}

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
        const timeoutId = setTimeout(() => {
            if (!res.headersSent) {
                console.error(`API timeout: ${req.method} ${req.originalUrl}`);

                res.status(504).json({
                    success: false,
                    message: 'API timeout',
                    path: req.originalUrl,
                });
            }
        }, 10000);

        try {
            if (getExtraQuery) {
                setQuery(req, getExtraQuery(req));
            }

            await handler(req as any, res as any);
        } catch (error) {
            next(error);
        } finally {
            clearTimeout(timeoutId);
        }
    };
}

const productsHandler = resolveHandler('api/products', productsModule);
const categoriesHandler = resolveHandler('api/categories', categoriesModule);
const categoryProductsHandler = resolveHandler(
    'api/categories/[category]/products',
    categoryProductsModule
);

const ordersHandler = resolveHandler('api/orders', ordersModule);

const authRegisterHandler = resolveHandler('api/auth/register', authRegisterModule);
const authLoginHandler = resolveHandler('api/auth/login', authLoginModule);
const authMeHandler = resolveHandler('api/auth/me', authMeModule);
const authLogoutHandler = resolveHandler('api/auth/logout', authLogoutModule);

const userOrdersHandler = resolveHandler('api/user/orders', userOrdersModule);

const telegramWebhookHandler = resolveHandler(
    'api/telegram-webhook',
    telegramWebhookModule
);

const setTelegramWebhookHandler = resolveHandler(
    'api/set-telegram-webhook',
    setTelegramWebhookModule
);

const healthHandler = resolveHandler('api/health', healthModule);
const pingHandler = resolveHandler('api/ping', pingModule);
const whoamiHandler = resolveHandler('api/whoami', whoamiModule);
const dbTestHandler = resolveHandler('api/db-test', dbTestModule);
const debugDbHandler = resolveHandler('api/debug/db', debugDbModule);

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
        categoryName: req.params.category,
        categoryId: req.params.category,
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
 * React Router fallback
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