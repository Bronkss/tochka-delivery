import type { VercelRequest, VercelResponse } from '@vercel/node';

const { getPool } = await import('./_db.js');

const {
    buildOrderKeyboard,
    formatOrderMessage,
    sendTelegramMessage,
} = await import('./_telegram.js');

interface IncomingOrderItem {
    id: string;
    title: string;
    quantity: number;
    price: number;
}

interface IncomingOrder {
    address?: string;
    items?: IncomingOrderItem[];
    total?: number;
    customer?: {
        name?: string;
        phone?: string;
        apartment?: string;
    };
    paymentMethod?: 'cash' | 'card';
    comments?: string;
    timestamp?: string;
}

interface NormalizedOrderItem {
    id: string;
    title: string;
    quantity: number;
    price: number;
}

function setCors(res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getBody<T>(req: VercelRequest): T {
    if (typeof req.body === 'string') {
        return JSON.parse(req.body) as T;
    }

    return req.body as T;
}

function normalizeItems(items: IncomingOrderItem[]): NormalizedOrderItem[] {
    return items
        .map((item) => ({
            id: String(item.id ?? '').trim(),
            title: String(item.title ?? '').trim().slice(0, 250),
            quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
            price: Math.max(0, Math.floor(Number(item.price) || 0)),
        }))
        .filter((item) => item.id && item.title && item.quantity > 0);
}

function getValidationError(order: IncomingOrder): string | null {
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

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }

    try {
        const pool = getPool();
        const order = getBody<IncomingOrder>(req);

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

        let createdOrder: {
            id: number;
            order_number: string;
            status: string;
            address: string;
            customer_name: string;
            customer_phone: string;
            apartment: string | null;
            payment_method: 'cash' | 'card';
            comments: string | null;
            total: number;
            courier_name: string | null;
            created_at: string;
        };

        try {
            await client.query('BEGIN');

            const orderResult = await client.query(
                `
                    INSERT INTO orders (
                        address,
                        customer_name,
                        customer_phone,
                        apartment,
                        payment_method,
                        comments,
                        total
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING
                        id,
                        order_number,
                        status,
                        address,
                        customer_name,
                        customer_phone,
                        apartment,
                        payment_method,
                        comments,
                        total,
                        courier_name,
                        created_at
                `,
                [
                    order.address?.trim(),
                    order.customer?.name?.trim(),
                    order.customer?.phone?.trim(),
                    order.customer?.apartment?.trim() || null,
                    order.paymentMethod,
                    order.comments?.trim() || null,
                    total,
                ]
            );

            createdOrder = orderResult.rows[0];

            for (const item of items) {
                await client.query(
                    `
                        INSERT INTO order_items (
                            order_id,
                            product_id,
                            title,
                            quantity,
                            price
                        )
                        VALUES ($1, $2, $3, $4, $5)
                    `,
                    [
                        createdOrder.id,
                        item.id,
                        item.title,
                        item.quantity,
                        item.price,
                    ]
                );
            }

            await client.query(
                `
                    INSERT INTO order_status_history (
                        order_id,
                        old_status,
                        new_status
                    )
                    VALUES ($1, $2, $3)
                `,
                [
                    createdOrder.id,
                    null,
                    createdOrder.status,
                ]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
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

            const telegramMessage = await sendTelegramMessage(
                courierChatId,
                formatOrderMessage(telegramOrder),
                buildOrderKeyboard(createdOrder.id, createdOrder.status)
            );

            await pool.query(
                `
                    UPDATE orders
                    SET
                        telegram_status = $1,
                        telegram_chat_id = $2,
                        telegram_message_id = $3,
                        telegram_sent_at = now()
                    WHERE id = $4
                `,
                [
                    'sent',
                    String(telegramMessage.chat.id),
                    telegramMessage.message_id,
                    createdOrder.id,
                ]
            );

            telegramSent = true;
        } catch (telegramError) {
            console.error('Telegram send error:', telegramError);

            await pool.query(
                `
                    UPDATE orders
                    SET telegram_status = $1
                    WHERE id = $2
                `,
                [
                    'failed',
                    createdOrder.id,
                ]
            );
        }

        return res.status(201).json({
            success: true,
            orderId: createdOrder.id,
            orderNumber: createdOrder.order_number,
            telegramSent,
        });
    } catch (error) {
        console.error('Create order error:', error);

        return res.status(500).json({
            success: false,
            message: 'Ошибка создания заказа',
        });
    }
}