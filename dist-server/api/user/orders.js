import { getPool } from '../_db.js';
import { requireUser } from '../_auth.js';
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        });
    }
    try {
        const user = await requireUser(req);
        const pool = getPool();
        const result = await pool.query(`
                SELECT
                    orders.id,
                    orders.order_number,
                    orders.status,
                    orders.address,
                    orders.apartment,
                    orders.payment_method,
                    orders.comments,
                    orders.total,
                    orders.created_at,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', order_items.id,
                                'productId', order_items.product_id,
                                'title', order_items.title,
                                'quantity', order_items.quantity,
                                'price', order_items.price
                            )
                            ORDER BY order_items.id ASC
                        ) FILTER (WHERE order_items.id IS NOT NULL),
                        '[]'
                    ) AS items
                FROM orders
                LEFT JOIN order_items ON order_items.order_id = orders.id
                WHERE orders.user_id = $1
                GROUP BY orders.id
                ORDER BY orders.created_at DESC
            `, [user.id]);
        return res.status(200).json({
            success: true,
            orders: result.rows,
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return res.status(401).json({
                success: false,
                message: 'Нужно войти в аккаунт',
            });
        }
        console.error('User orders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Ошибка загрузки заказов',
        });
    }
}
