import type { VercelRequest, VercelResponse } from '@vercel/node';

import { getPool } from './_db';
import {
    answerCallbackQuery,
    buildOrderKeyboard,
    editTelegramMessage,
    formatOrderMessage,
    getTelegramUserName,
    sendTelegramMessage,
} from './_telegram';

import type { TelegramUser } from './_telegram';

interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        text?: string;
        chat: {
            id: number | string;
            title?: string;
        };
        from?: TelegramUser;
    };
    callback_query?: {
        id: string;
        from: TelegramUser;
        data?: string;
        message?: {
            message_id: number;
            chat: {
                id: number | string;
            };
        };
    };
}

type OrderAction =
    | 'accept'
    | 'assembling'
    | 'delivering'
    | 'completed'
    | 'cancel';

function getBody<T>(req: VercelRequest): T {
    if (typeof req.body === 'string') {
        return JSON.parse(req.body) as T;
    }

    return req.body as T;
}

function getHeaderValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }

    return value ?? '';
}

function getNextStatus(action: OrderAction): string {
    const map: Record<OrderAction, string> = {
        accept: 'accepted',
        assembling: 'assembling',
        delivering: 'delivering',
        completed: 'completed',
        cancel: 'cancelled',
    };

    return map[action];
}

function getActionSuccessText(action: OrderAction): string {
    const map: Record<OrderAction, string> = {
        accept: 'Заказ принят',
        assembling: 'Статус: заказ собирается',
        delivering: 'Статус: курьер в пути',
        completed: 'Заказ доставлен',
        cancel: 'Заказ отменён',
    };

    return map[action];
}

async function answerAndFinish(
    res: VercelResponse,
    callbackQueryId: string,
    text: string,
    showAlert = false
) {
    await answerCallbackQuery(callbackQueryId, text, showAlert);

    return res.status(200).json({
        ok: true,
    });
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            ok: false,
            message: 'Method not allowed',
        });
    }

    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!expectedSecret) {
        return res.status(500).json({
            ok: false,
            message: 'TELEGRAM_WEBHOOK_SECRET is not set',
        });
    }

    const actualSecret = getHeaderValue(
        req.headers['x-telegram-bot-api-secret-token']
    );

    if (actualSecret !== expectedSecret) {
        return res.status(401).json({
            ok: false,
            message: 'Unauthorized',
        });
    }

    try {
        const update = getBody<TelegramUpdate>(req);

        if (update.message?.text?.startsWith('/chatid')) {
            await sendTelegramMessage(
                update.message.chat.id,
                `chat_id этой группы: <code>${update.message.chat.id}</code>`
            );

            return res.status(200).json({
                ok: true,
            });
        }

        const callback = update.callback_query;

        if (!callback) {
            return res.status(200).json({
                ok: true,
            });
        }

        const callbackData = callback.data ?? '';
        const match = /^order:(\d+):(accept|assembling|delivering|completed|cancel)$/.exec(callbackData);

        if (!match) {
            return answerAndFinish(
                res,
                callback.id,
                'Не понял команду',
                true
            );
        }

        const orderId = Number(match[1]);
        const action = match[2] as OrderAction;
        const nextStatus = getNextStatus(action);

        const pool = getPool();
        const client = await pool.connect();

        let updatedOrder: {
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
            telegram_chat_id: string | null;
            telegram_message_id: number | null;
            courier_telegram_id: string | null;
            courier_name: string | null;
            created_at: string;
        };

        let orderItems: Array<{
            title: string;
            quantity: number;
            price: number;
        }> = [];

        try {
            await client.query('BEGIN');

            const orderResult = await client.query(
                `
                    SELECT *
                    FROM orders
                    WHERE id = $1
                    FOR UPDATE
                `,
                [orderId]
            );

            const currentOrder = orderResult.rows[0];

            if (!currentOrder) {
                await client.query('ROLLBACK');

                return answerAndFinish(
                    res,
                    callback.id,
                    'Заказ не найден',
                    true
                );
            }

            if (
                currentOrder.status === 'completed' ||
                currentOrder.status === 'cancelled'
            ) {
                await client.query('ROLLBACK');

                return answerAndFinish(
                    res,
                    callback.id,
                    'Этот заказ уже закрыт',
                    true
                );
            }

            const courierTelegramId = String(callback.from.id);
            const courierName = getTelegramUserName(callback.from);

            if (
                currentOrder.courier_telegram_id &&
                currentOrder.courier_telegram_id !== courierTelegramId
            ) {
                await client.query('ROLLBACK');

                return answerAndFinish(
                    res,
                    callback.id,
                    `Заказ уже закреплён за ${currentOrder.courier_name}`,
                    true
                );
            }

            if (action !== 'accept' && currentOrder.status === 'new') {
                await client.query('ROLLBACK');

                return answerAndFinish(
                    res,
                    callback.id,
                    'Сначала нужно принять заказ',
                    true
                );
            }

            const shouldAssignCourier =
                action === 'accept' ||
                (!currentOrder.courier_telegram_id && action !== 'cancel');

            const updateResult = await client.query(
                `
                    UPDATE orders
                    SET
                        status = $1,
                        courier_telegram_id = CASE
                            WHEN $2::boolean THEN $3
                            ELSE courier_telegram_id
                        END,
                        courier_name = CASE
                            WHEN $2::boolean THEN $4
                            ELSE courier_name
                        END
                    WHERE id = $5
                    RETURNING *
                `,
                [
                    nextStatus,
                    shouldAssignCourier,
                    courierTelegramId,
                    courierName,
                    orderId,
                ]
            );

            updatedOrder = updateResult.rows[0];

            await client.query(
                `
                    INSERT INTO order_status_history (
                        order_id,
                        old_status,
                        new_status,
                        changed_by_telegram_id,
                        changed_by_name
                    )
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    orderId,
                    currentOrder.status,
                    nextStatus,
                    courierTelegramId,
                    courierName,
                ]
            );

            const itemsResult = await client.query(
                `
                    SELECT
                        title,
                        quantity,
                        price
                    FROM order_items
                    WHERE order_id = $1
                    ORDER BY id ASC
                `,
                [orderId]
            );

            orderItems = itemsResult.rows;

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        const chatId =
            updatedOrder.telegram_chat_id ??
            callback.message?.chat.id ??
            process.env.TELEGRAM_COURIER_CHAT_ID;

        const messageId =
            updatedOrder.telegram_message_id ??
            callback.message?.message_id;

        if (chatId && messageId) {
            try {
                await editTelegramMessage(
                    chatId,
                    Number(messageId),
                    formatOrderMessage({
                        ...updatedOrder,
                        items: orderItems,
                    }),
                    buildOrderKeyboard(updatedOrder.id, updatedOrder.status)
                );
            } catch (editError) {
                console.error('Telegram edit message error:', editError);
            }
        }

        return answerAndFinish(
            res,
            callback.id,
            getActionSuccessText(action)
        );
    } catch (error) {
        console.error('Telegram webhook error:', error);

        return res.status(500).json({
            ok: false,
        });
    }
}