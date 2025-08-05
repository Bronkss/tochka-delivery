import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

// Конфигурация бота
const TOKEN = '8202147518:AAEcqKab3RS-SvBq8YpDNE51ySsvvoQuEGQ';
const CHAT_ID = 598348966; // Ваш chat_id
const CHAT_DELIVERYMAN_ID = 7087767283;

// Инициализация бота с улучшенными настройками
const bot = new TelegramBot(TOKEN, {
    polling: false, // Отключаем polling, так как используем только отправку сообщений
    request: {
        timeout: 10000, // Увеличиваем таймаут
        agent: null,
    },
});

// Мидлвар для логирования запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Эндпоинт для отправки заказов
app.post('/send-order', async (req, res) => {
    console.log('Получен заказ:', JSON.stringify(req.body, null, 2));

    try {
        // Валидация входящих данных
        if (!req.body || !req.body.items || !req.body.customer) {
            throw new Error('Неверный формат данных заказа');
        }

        const { customer, items, address, total, paymentMethod, comments } = req.body;

        // Формируем сообщение для админов
        const adminMessage = `📦 <b>Новый заказ!</b>\n\n` +
            `👤 <b>Клиент:</b> ${customer.name}\n` +
            `📞 <b>Телефон:</b> ${customer.phone}\n` +
            `🏠 <b>Адрес:</b> ${address}\n` +
            (customer.apartment ? `🚪 <b>Квартира/офис:</b> ${customer.apartment}\n\n` : '\n') +
            `🛒 <b>Заказ:</b>\n${items.map(item =>
                `- ${item.title} (${item.quantity} × ${item.price}₽) = ${item.quantity * item.price}₽`
            ).join('\n')}\n\n` +
            `💰 <b>Итого:</b> ${total}₽\n` +
            `💳 <b>Способ оплаты:</b> ${paymentMethod === 'cash' ? 'Наличные' : 'Карта'}\n` +
            (comments ? `\n📝 <b>Комментарий:</b> ${comments}` : '');

        // Формируем сообщение для курьера (более краткое)
        const deliveryMessage = `🚴 <b>Новый заказ для доставки!</b>\n\n` +
            `👤 ${customer.name}\n` +
            `📞 ${customer.phone}\n` +
            `🏠 ${address}${customer.apartment ? `, кв. ${customer.apartment}` : ''}\n\n` +
            `🛍️ ${items.length} позиций на сумму ${total}₽\n` +
            `💳 ${paymentMethod === 'cash' ? 'Наличные' : 'Карта'}`;

        console.log('Формируем сообщения для Telegram:');
        console.log('Для админов:', adminMessage);
        console.log('Для курьера:', deliveryMessage);

        // Функция для отправки с повторными попытками
        const sendWithRetry = async (chatId: number, message: string) => {
            let attempts = 3;
            let lastError = null;

            while (attempts > 0) {
                try {
                    const sentMessage = await bot.sendMessage(chatId, message, {
                        parse_mode: 'HTML',
                        disable_web_page_preview: true,
                    });
                    return sentMessage;
                } catch (error) {
                    attempts--;
                    lastError = error;
                    console.error(`Ошибка отправки в чат ${chatId} (попытка ${4 - attempts}):`, error);
                    if (attempts > 0) await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            throw lastError || new Error(`Не удалось отправить сообщение в чат ${chatId}`);
        };

        // Отправляем в оба чата параллельно
        const [adminResult, deliverymanResult] = await Promise.all([
            sendWithRetry(CHAT_ID, adminMessage),
            sendWithRetry(CHAT_DELIVERYMAN_ID, deliveryMessage),
        ]);

        console.log('Сообщения успешно отправлены:', {
            adminChat: adminResult.message_id,
            deliverymanChat: deliverymanResult.message_id,
        });

        return res.json({
            success: true,
            message: 'Заказ успешно отправлен администратору и курьеру',
            messageIds: {
                admin: adminResult.message_id,
                deliveryman: deliverymanResult.message_id,
            }
        });

    } catch (error) {
        console.error('Финальная ошибка обработки заказа:', error);

        const errorResponse = {
            success: false,
            error: error.message,
            details: {
                code: error.code,
                response: error.response?.body,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
        };

        res.status(500).json(errorResponse);
    }
});

// Проверка доступности бота
async function checkBotAvailability() {
    try {
        console.log('Проверяем доступность бота...');

        // 1. Проверяем, что бот валидный
        const me = await bot.getMe();
        console.log(`Бот @${me.username} (ID: ${me.id}) доступен`);

        // 2. Проверяем, что можем отправлять сообщения
        const testMessage = await bot.sendMessage(CHAT_ID, '🔌 Тестовое сообщение от бота', {
            parse_mode: 'HTML',
        });

        console.log(`Тестовое сообщение отправлено (ID: ${testMessage.message_id})`);
        return true;
    } catch (error) {
        console.error('Ошибка проверки бота:', error);

        // Детальный анализ ошибки
        if (error.code === 'ETELEGRAM' && error.response?.body?.error_code === 401) {
            console.error('Ошибка: Неверный токен бота');
        } else if (error.code === 'ETELEGRAM' && error.response?.body?.error_code === 400) {
            console.error('Ошибка: Проблема с chat_id. Проверьте:');
            console.error('- Бот добавлен в чат?');
            console.error('- Бот имеет права на отправку сообщений?');
            console.error('- CHAT_ID точно правильный?');
        } else {
            console.error('Неизвестная ошибка:', error);
        }

        return false;
    }
}

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту ${PORT}`);

    const botAvailable = await checkBotAvailability();
    if (!botAvailable) {
        console.error('❌ Бот недоступен, проверьте настройки');
        process.exit(1);
    }

    console.log('✅ Бот готов к приему заказов');
});

// Обработка ошибок процесса
process.on('unhandledRejection', (error) => {
    console.error('Необработанное исключение:', error);
});