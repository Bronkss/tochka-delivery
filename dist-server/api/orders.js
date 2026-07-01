function setCors(res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function getBody(req) {
    if (typeof req.body === 'string') {
        return JSON.parse(req.body);
    }
    return req.body;
}
function normalizeItems(items) {
    return items
        .map((item) => ({
        id: String(item.id ?? '').trim(),
        title: String(item.title ?? '').trim().slice(0, 250),
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        price: Math.max(0, Math.floor(Number(item.price) || 0)),
    }))
        .filter((item) => item.id && item.title && item.quantity > 0);
}
function getValidationError(order) {
    if (!order.address || order.address.trim().length < 5) {
        return 'Некорректный адрес доставки';
    }
    if (!order.customer?.name || order.customer.name.trim().length < 2) {
        return 'Некорректное имя клиента';
    }
    if (!order.customer?.phone || order.customer.phone.trim().length < 6) {
        return 'Некорректный телефон клиента';
    }
    if (order.paymentMethod !== 'cash' && order.paymentMethod !== 'card') {
        return 'Некорректный способ оплаты';
    }
    if (!Array.isArray(order.items) || order.items.length === 0) {
        return 'Корзина пуста';
    }
    return null;
}
export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            message: 'Orders API is alive. Use POST /api/orders to create an order.',
        });
    }
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }
    try {
        const { getPool } = await import('./_db.js');
        const { requireUser } = await import('./_auth.js');
        const { buildOrderKeyboard, formatOrderMessage, sendTelegramMessage, } = await import('./_telegram.js');
        const user = await requireUser(req);
        const pool = getPool();
        const order = getBody(req);
        const validationError = getValidationError(order);
        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }
        const items = normalizeItems(order.items ?? []);
        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Корзина пуста',
            });
        }
        const total = items.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);
        if (total < 100) {
            return res.status(400).json({
                success: false,
                message: 'Минимальная сумма заказа — 100 ₽',
            });
        }
        const client = await pool.connect();
        let createdOrder;
        try {
            await client.query('BEGIN');
            const orderResult = await client.query(`
                    INSERT INTO orders (
                        user_id,
                        address,
                        customer_name,
                        customer_phone,
                        apartment,
                        payment_method,
                        comments,
                        total
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING
                        id,
                        order_number,
                        status,
                        user_id,
                        address,
                        customer_name,
                        customer_phone,
                        apartment,
                        payment_method,
                        comments,
                        total,
                        courier_name,
                        created_at
                `, [
                user.id,
                order.address?.trim(),
                order.customer?.name?.trim(),
                order.customer?.phone?.trim(),
                order.customer?.apartment?.trim() || null,
                order.paymentMethod,
                order.comments?.trim() || null,
                total,
            ]);
            createdOrder = orderResult.rows[0];
            for (const item of items) {
                await client.query(`
                        INSERT INTO order_items (
                            order_id,
                            product_id,
                            title,
                            quantity,
                            price
                        )
                        VALUES ($1, $2, $3, $4, $5)
                    `, [
                    createdOrder.id,
                    item.id,
                    item.title,
                    item.quantity,
                    item.price,
                ]);
            }
            await client.query(`
                    INSERT INTO order_status_history (
                        order_id,
                        old_status,
                        new_status
                    )
                    VALUES ($1, $2, $3)
                `, [
                createdOrder.id,
                null,
                createdOrder.status,
            ]);
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
        let telegramSent = false;
        try {
            const courierChatId = process.env.TELEGRAM_COURIER_CHAT_ID;
            if (!courierChatId) {
                throw new Error('TELEGRAM_COURIER_CHAT_ID is not set');
            }
            const telegramOrder = {
                ...createdOrder,
                items,
            };
            const telegramMessage = await sendTelegramMessage(courierChatId, formatOrderMessage(telegramOrder), buildOrderKeyboard(createdOrder.id, createdOrder.status));
            await pool.query(`
                    UPDATE orders
                    SET
                        telegram_status = $1,
                        telegram_chat_id = $2,
                        telegram_message_id = $3,
                        telegram_sent_at = now()
                    WHERE id = $4
                `, [
                'sent',
                String(telegramMessage.chat.id),
                telegramMessage.message_id,
                createdOrder.id,
            ]);
            telegramSent = true;
        }
        catch (telegramError) {
            console.error('Telegram send error:', telegramError);
            await pool.query(`
                    UPDATE orders
                    SET telegram_status = $1
                    WHERE id = $2
                `, [
                'failed',
                createdOrder.id,
            ]);
        }
        return res.status(201).json({
            success: true,
            orderId: createdOrder.id,
            orderNumber: createdOrder.order_number,
            telegramSent,
        });
    }
    catch (error) {
        console.error('Create order error:', error);
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return res.status(401).json({
                success: false,
                message: 'Для оформления заказа нужно войти в аккаунт',
            });
        }
        return res.status(500).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : 'Ошибка создания заказа',
        });
    }
}
