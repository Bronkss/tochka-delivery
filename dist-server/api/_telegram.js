function getBotToken() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    return token;
}
function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}
export function getTelegramUserName(user) {
    const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();
    if (user.username) {
        return fullName
            ? `${fullName} (@${user.username})`
            : `@${user.username}`;
    }
    return fullName || String(user.id);
}
async function callTelegram(method, payload) {
    const token = getBotToken();
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
        throw new Error(data.description || `Telegram API error: ${response.status}`);
    }
    return data.result;
}
export async function sendTelegramMessage(chatId, text, replyMarkup) {
    return callTelegram('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
    });
}
export async function editTelegramMessage(chatId, messageId, text, replyMarkup) {
    return callTelegram('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
    });
}
export async function answerCallbackQuery(callbackQueryId, text, showAlert = false) {
    return callTelegram('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
    });
}
export async function setTelegramWebhook(webhookUrl, secretToken) {
    return callTelegram('setWebhook', {
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
    });
}
function getStatusLabel(status) {
    const labels = {
        new: '🆕 Новый',
        accepted: '✅ Принят курьером',
        assembling: '📦 Собирается',
        delivering: '🚚 Курьер в пути',
        completed: '🏁 Доставлен',
        cancelled: '❌ Отменён',
    };
    return labels[status] ?? status;
}
function getPaymentLabel(paymentMethod) {
    if (paymentMethod === 'cash') {
        return 'Наличными курьеру';
    }
    return 'Картой курьеру';
}
export function buildOrderKeyboard(orderId, status) {
    if (status === 'completed' || status === 'cancelled') {
        return undefined;
    }
    if (status === 'new') {
        return {
            inline_keyboard: [
                [
                    {
                        text: '✅ Принять заказ',
                        callback_data: `order:${orderId}:accept`,
                    },
                ],
                [
                    {
                        text: '❌ Отменить',
                        callback_data: `order:${orderId}:cancel`,
                    },
                ],
            ],
        };
    }
    if (status === 'accepted') {
        return {
            inline_keyboard: [
                [
                    {
                        text: '📦 В сборке',
                        callback_data: `order:${orderId}:assembling`,
                    },
                ],
                [
                    {
                        text: '🚚 В пути',
                        callback_data: `order:${orderId}:delivering`,
                    },
                ],
                [
                    {
                        text: '🏁 Доставлен',
                        callback_data: `order:${orderId}:completed`,
                    },
                ],
                [
                    {
                        text: '❌ Отменить',
                        callback_data: `order:${orderId}:cancel`,
                    },
                ],
            ],
        };
    }
    if (status === 'assembling') {
        return {
            inline_keyboard: [
                [
                    {
                        text: '🚚 В пути',
                        callback_data: `order:${orderId}:delivering`,
                    },
                ],
                [
                    {
                        text: '🏁 Доставлен',
                        callback_data: `order:${orderId}:completed`,
                    },
                ],
                [
                    {
                        text: '❌ Отменить',
                        callback_data: `order:${orderId}:cancel`,
                    },
                ],
            ],
        };
    }
    if (status === 'delivering') {
        return {
            inline_keyboard: [
                [
                    {
                        text: '🏁 Доставлен',
                        callback_data: `order:${orderId}:completed`,
                    },
                ],
                [
                    {
                        text: '❌ Отменить',
                        callback_data: `order:${orderId}:cancel`,
                    },
                ],
            ],
        };
    }
    return undefined;
}
export function formatOrderMessage(order) {
    const itemsText = order.items.length > 0
        ? order.items
            .map((item, index) => {
            const itemTotal = item.price * item.quantity;
            return [
                `${index + 1}. <b>${escapeHtml(item.title)}</b>`,
                `   ${item.quantity} × ${item.price} ₽ = <b>${itemTotal} ₽</b>`,
            ].join('\n');
        })
            .join('\n\n')
        : 'Нет товаров';
    const apartmentText = order.apartment
        ? `\nКвартира / подъезд / этаж: <b>${escapeHtml(order.apartment)}</b>`
        : '';
    const commentsText = order.comments
        ? `\n\nКомментарий:\n${escapeHtml(order.comments)}`
        : '';
    const courierText = order.courier_name
        ? `\n\nКурьер: <b>${escapeHtml(order.courier_name)}</b>`
        : '';
    return [
        `🛒 <b>Заказ ${escapeHtml(order.order_number)}</b>`,
        '',
        `Статус: <b>${getStatusLabel(order.status)}</b>`,
        '',
        `Адрес:`,
        `<b>${escapeHtml(order.address)}</b>${apartmentText}`,
        '',
        `Клиент:`,
        `<b>${escapeHtml(order.customer_name)}</b>`,
        `<a href="tel:${escapeHtml(order.customer_phone)}">${escapeHtml(order.customer_phone)}</a>`,
        '',
        `Оплата: <b>${getPaymentLabel(order.payment_method)}</b>`,
        '',
        `Состав заказа:`,
        itemsText,
        '',
        `Итого: <b>${order.total} ₽</b>`,
        commentsText,
        courierText,
    ].join('\n');
}
