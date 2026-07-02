import { useEffect, useMemo, useState } from "react";

import "../styles/components/UserOrders.css";

interface UserOrderItem {
    productId: string;
    title: string;
    quantity: number;
    price: number;
}

interface UserOrder {
    id: number;
    orderNumber: string;
    status: string;
    address: string;
    paymentMethod: string;
    comments: string | null;
    total: number;
    createdAt: string;
    updatedAt: string;
    canCancel: boolean;
    items: UserOrderItem[];
}

interface UserOrdersResponse {
    success: boolean;
    orders?: UserOrder[];
    message?: string;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function getStatusStep(status: string): number {
    if (status === "new") return 1;
    if (status === "accepted" || status === "assembling") return 2;
    if (status === "delivering") return 3;
    if (status === "completed") return 3;
    return 0;
}

function getStatusText(status: string): string {
    if (status === "cancelled") return "Заказ отменён";
    if (status === "completed") return "Заказ завершён";

    const step = getStatusStep(status);

    if (step === 1) return "Ожидаем принятия заказа";
    if (step === 2) return "Заказ в сборке";
    if (step === 3) return "Курьер в пути";

    return "Ожидаем принятия заказа";
}

function getPaymentText(value: string): string {
    if (value === "card") return "Картой курьеру";
    return "Наличными курьеру";
}

function isFinalStatus(status: string): boolean {
    return status === "cancelled" || status === "completed";
}

export default function UserOrders() {
    const [orders, setOrders] = useState<UserOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const hasOrders = orders.length > 0;

    const sortedOrders = useMemo(() => {
        return [...orders].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [orders]);

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch("/api/user/orders", {
                credentials: "include",
            });

            const data: UserOrdersResponse = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Не удалось загрузить заказы");
            }

            setOrders(data.orders ?? []);
        } catch (error) {
            console.error("Ошибка загрузки заказов:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Ошибка загрузки заказов"
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleCancelOrder = async (orderId: number) => {
        const isConfirmed = window.confirm("Отменить заказ?");

        if (!isConfirmed) {
            return;
        }

        try {
            setCancelingOrderId(orderId);
            setError(null);

            const response = await fetch("/api/user/orders", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    orderId,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Не удалось отменить заказ");
            }

            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.id === orderId
                        ? {
                            ...order,
                            status: "cancelled",
                            canCancel: false,
                            updatedAt: new Date().toISOString(),
                        }
                        : order
                )
            );
        } catch (error) {
            console.error("Ошибка отмены заказа:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Ошибка отмены заказа"
            );
        } finally {
            setCancelingOrderId(null);
        }
    };

    return (
        <section className="user-orders">
            <div className="user-orders__header">
                <div>
                    <h2>Мои заказы</h2>
                    <p>Отслеживайте статус доставки и отменяйте заказ, если он ещё не уехал к вам.</p>
                </div>

                <button
                    type="button"
                    className="user-orders__refresh"
                    onClick={loadOrders}
                    disabled={isLoading}
                >
                    Обновить
                </button>
            </div>

            {isLoading && (
                <div className="user-orders__loading">
                    <span />
                    Загружаем заказы...
                </div>
            )}

            {error && (
                <div className="user-orders__error">
                    {error}
                </div>
            )}

            {!isLoading && !error && !hasOrders && (
                <div className="user-orders__empty">
                    <div className="user-orders__empty-icon">🧺</div>
                    <h3>Заказов пока нет</h3>
                    <p>Когда вы оформите первый заказ, он появится здесь.</p>
                </div>
            )}

            <div className="user-orders__list">
                {sortedOrders.map((order) => {
                    const currentStep = getStatusStep(order.status);
                    const statusText = getStatusText(order.status);
                    const isCancelled = order.status === "cancelled";
                    const isCompleted = order.status === "completed";
                    const finalStatus = isFinalStatus(order.status);

                    return (
                        <article
                            key={order.id}
                            className={
                                isCancelled
                                    ? "user-order user-order--cancelled"
                                    : isCompleted
                                        ? "user-order user-order--completed"
                                        : "user-order"
                            }
                        >
                            <div className="user-order__top">
                                <div>
                                    <span className="user-order__number">
                                        {order.orderNumber}
                                    </span>

                                    <h3>{statusText}</h3>

                                    <p className="user-order__date">
                                        {formatDate(order.createdAt)}
                                    </p>
                                </div>

                                <div className="user-order__total">
                                    {order.total} ₽
                                </div>
                            </div>

                            {!finalStatus ? (
                                <div className="order-progress">
                                    <div
                                        className="order-progress__line"
                                        style={{
                                            width: `${Math.max(0, currentStep - 1) * 50}%`,
                                        }}
                                    />

                                    <div
                                        className={
                                            currentStep >= 1
                                                ? "order-progress__step order-progress__step--active"
                                                : "order-progress__step"
                                        }
                                    >
                                        <span>1</span>
                                        <p>Ожидаем принятия</p>
                                    </div>

                                    <div
                                        className={
                                            currentStep >= 2
                                                ? "order-progress__step order-progress__step--active"
                                                : "order-progress__step"
                                        }
                                    >
                                        <span>2</span>
                                        <p>В сборке</p>
                                    </div>

                                    <div
                                        className={
                                            currentStep >= 3
                                                ? "order-progress__step order-progress__step--active"
                                                : "order-progress__step"
                                        }
                                    >
                                        <span>3</span>
                                        <p>Курьер в пути</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="user-order__final-status">
                                    {isCancelled ? "Заказ был отменён" : "Заказ завершён"}
                                </div>
                            )}

                            <div className="user-order__info">
                                <div>
                                    <span>Адрес</span>
                                    <strong>{order.address}</strong>
                                </div>

                                <div>
                                    <span>Оплата</span>
                                    <strong>{getPaymentText(order.paymentMethod)}</strong>
                                </div>
                            </div>

                            <div className="user-order__items">
                                {order.items.map((item) => (
                                    <div
                                        key={`${order.id}-${item.productId}-${item.title}`}
                                        className="user-order__item"
                                    >
                                        <span>
                                            {item.title}
                                        </span>

                                        <strong>
                                            {item.quantity} × {item.price} ₽
                                        </strong>
                                    </div>
                                ))}
                            </div>

                            <div className="user-order__actions">
                                {order.canCancel && !finalStatus && (
                                    <button
                                        type="button"
                                        className="user-order__cancel"
                                        onClick={() => handleCancelOrder(order.id)}
                                        disabled={cancelingOrderId === order.id}
                                    >
                                        {cancelingOrderId === order.id
                                            ? "Отменяем..."
                                            : "Отменить заказ"}
                                    </button>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}