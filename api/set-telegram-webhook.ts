import type { VercelRequest, VercelResponse } from '@vercel/node';

import { setTelegramWebhook } from './_telegram';

function getQueryValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }

    return value ?? '';
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }

    const setupSecret = process.env.WEBHOOK_SETUP_SECRET;
    const telegramWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!setupSecret || !telegramWebhookSecret) {
        return res.status(500).json({
            success: false,
            message: 'WEBHOOK_SETUP_SECRET or TELEGRAM_WEBHOOK_SECRET is not set',
        });
    }

    const requestSecret = getQueryValue(req.query.secret);

    if (requestSecret !== setupSecret) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }

    const appUrl = (process.env.APP_URL || `https://${req.headers.host}`)
        .replace(/\/$/, '');

    const webhookUrl = `${appUrl}/api/telegram-webhook`;

    try {
        await setTelegramWebhook(webhookUrl, telegramWebhookSecret);

        return res.status(200).json({
            success: true,
            webhookUrl,
        });
    } catch (error) {
        console.error('Set webhook error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to set Telegram webhook',
        });
    }
}