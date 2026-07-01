async function callTelegram(method, payload) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    }
    catch {
        throw new Error(`Telegram returned non-JSON response: ${text.slice(0, 300)}`);
    }
    if (!response.ok || !data.ok) {
        throw new Error(data.description || `Telegram API error: ${response.status}`);
    }
    return data.result;
}
function getQueryValue(value) {
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }
    return value ?? '';
}
export default async function handler(req, res) {
    try {
        if (req.method !== 'GET' && req.method !== 'POST') {
            return res.status(405).json({
                success: false,
                message: 'Method not allowed',
            });
        }
        const setupSecret = process.env.WEBHOOK_SETUP_SECRET;
        const telegramWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!setupSecret) {
            return res.status(500).json({
                success: false,
                message: 'WEBHOOK_SETUP_SECRET is not set',
            });
        }
        if (!telegramWebhookSecret) {
            return res.status(500).json({
                success: false,
                message: 'TELEGRAM_WEBHOOK_SECRET is not set',
            });
        }
        if (!telegramBotToken) {
            return res.status(500).json({
                success: false,
                message: 'TELEGRAM_BOT_TOKEN is not set',
            });
        }
        const requestSecret = getQueryValue(req.query.secret);
        if (requestSecret !== setupSecret) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: wrong secret',
            });
        }
        const appUrl = (process.env.APP_URL || `https://${req.headers.host}`)
            .replace(/\/$/, '');
        const webhookUrl = `${appUrl}/api/telegram-webhook`;
        await callTelegram('setWebhook', {
            url: webhookUrl,
            secret_token: telegramWebhookSecret,
            allowed_updates: ['message', 'callback_query'],
            drop_pending_updates: true,
        });
        return res.status(200).json({
            success: true,
            webhookUrl,
        });
    }
    catch (error) {
        console.error('Set webhook error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
