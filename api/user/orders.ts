import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage, getPool } from '../../server/db.js';
import { requireUser } from '../_auth.js';

interface OrderRow {
    id: number;
    order_number: string;
    status: string;
    address: string;
    payment_method: string;
    comments: string | null;
    total: number | string;
    created_at: string;
    updated_at: string;
}

interface OrderItemRow {
    order_id: number;
    product_id: string;
    title: string;
    quantity: number | string;
    price: number | string;
}

function toNumber(value: unknown): number {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        return 0;
    }

    return numberValue;
}

function getBodyOrderId(value: unknown): number {
    const orderId = Number(value);

    if (!Number.isFinite(orderId) || orderId <= 0) {
        return 0;
    }

    return Math.floor(orderId);
}

function canCancelOrder(status: string): boolean {
    return ['new', 'accepted', 'assembling'].includes(status);
}

async function getUserOrders(req: VercelRequest, res: VercelResponse) {
    const user = await requireUser(req);
    const pool = getPool();

    const ordersResult = await pool.query<OrderRow>(
        `
            SELECT
                id,
                order_number,
                status,
                address,
                payment_method,
                comments,
                total,
                created_at,
                updated_at
            FROM orders
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        `,
        [user.id]
    );

    const orderIds = ordersResult.rows.map((order) => order.id);

    let itemsByOrderId = new Map<number, OrderItemRow[]>();

    if (orderIds.length > 0) {
        const itemsResult = await pool.query<OrderItemRow>(
            `
                SELECT
                    order_id,
                    product_id,
                    title,
                    quantity,
                    price
                FROM order_items
                WHERE order_id = ANY($1::bigint[])
                ORDER BY id ASC
            `,
            [orderIds]
        );

        itemsByOrderId = itemsResult.rows.reduce((map, item) => {
            const currentItems = map.get(item.order_id) ?? [];
            currentItems.push(item);
            map.set(item.order_id, currentItems);
            return map;
        }, new Map<number, OrderItemRow[]>());
    }

    const orders = ordersResult.rows.map((order) => ({
        id: Number(order.id),
        orderNumber: order.order_number,
        status: order.status,
        address: order.address,
        paymentMethod: order.payment_method,
        comments: order.comments,
        total: toNumber(order.total),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        canCancel: canCancelOrder(order.status),
        items: (itemsByOrderId.get(order.id) ?? []).map((item) => ({
            productId: item.product_id,
            title: item.title,
            quantity: toNumber(item.quantity),
            price: toNumber(item.price),
        })),
    }));

    return res.status(200).json({
        success: true,
        orders,
    });
}

async function cancelUserOrder(req: VercelRequest, res: VercelResponse) {
    const user = await requireUser(req);
    const orderId = getBodyOrderId(req.body?.orderId);

    if (!orderId) {
        return res.status(400).json({
            success: false,
            message: 'Некорректный номер заказа',
        });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const orderResult = await client.query<{
            id: number;
            status: string;
            order_number: string;
        }>(
            `
                SELECT
                    id,
                    status,
                    order_number
                FROM orders
                WHERE id = $1
                  AND user_id = $2
                FOR UPDATE
            `,
            [orderId, user.id]
        );

        const order = orderResult.rows[0];

        if (!order) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                success: false,
                message: 'Заказ не найден',
            });
        }

        if (order.status === 'cancelled') {
            await client.query('COMMIT');

            return res.status(200).json({
                success: true,
                message: 'Заказ уже отменён',
                orderId,
                orderNumber: order.order_number,
                status: 'cancelled',
            });
        }

        if (!canCancelOrder(order.status)) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                success: false,
                message: 'Этот заказ уже нельзя отменить',
            });
        }

        /**
         * Если в /api/orders у тебя списываются остатки,
         * этот блок вернёт товары на склад при отмене.
         */
        await client.query(
            `
                UPDATE products
                SET stock = stock + order_items.quantity
                FROM order_items
                WHERE order_items.order_id = $1
                  AND products.id::text = order_items.product_id
            `,
            [orderId]
        );

        await client.query(
            `
                UPDATE orders
                SET status = 'cancelled',
                    updated_at = now()
                WHERE id = $1
            `,
            [orderId]
        );

        await client.query(
            `
                INSERT INTO order_status_history (
                    order_id,
                    old_status,
                    new_status,
                    changed_by_name,
                    created_at
                )
                VALUES ($1, $2, 'cancelled', $3, now())
            `,
            [
                orderId,
                order.status,
                user.name || user.email || 'Пользователь',
            ]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'Заказ отменён',
            orderId,
            orderNumber: order.order_number,
            status: 'cancelled',
        });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    try {
        if (req.method === 'GET') {
            return await getUserOrders(req, res);
        }

        if (req.method === 'PATCH') {
            return await cancelUserOrder(req, res);
        }

        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    } catch (error) {
        console.error('User orders API error:', error);

        const message = getErrorMessage(error);

        if (message === 'UNAUTHORIZED') {
            return res.status(401).json({
                success: false,
                message: 'Необходима авторизация',
            });
        }

        return res.status(500).json({
            success: false,
            message,
        });
    }
}