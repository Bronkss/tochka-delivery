import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import Header from '../components/Header';
import Navbar from '../components/Navbar';
import LocationBasketSwitcher from '../components/LocationBasketSwitcher';

import type { AppDispatch, RootState } from '../app/store';
import { clearUser } from '../app/authSlice';

interface UserOrderItem {
    id: number;
    productId: string;
    title: string;
    quantity: number;
    price: number;
}

interface UserOrder {
    id: number;
    order_number: string;
    status: string;
    address: string;
    apartment: string | null;
    payment_method: 'cash' | 'card';
    comments: string | null;
    total: number;
    created_at: string;
    items: UserOrderItem[];
}

interface OrdersResponse {
    success: boolean;
    orders?: UserOrder[];
    message?: string;
}

function getStatusText(status: string): string {
    const statuses: Record<string, string> = {
        new: 'Новый',
        accepted: 'Принят',
        assembling: 'Собирается',
        delivering: 'В пути',
        completed: 'Доставлен',
        cancelled: 'Отменён',
    };

    return statuses[status] ?? status;
}

export default function Profile() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const user = useSelector((state: RootState) => state.auth.user);
    const isInitialized = useSelector(
        (state: RootState) => state.auth.isInitialized
    );

    const [orders, setOrders] = useState<UserOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isInitialized) return;

        if (!user) {
            navigate('/auth?redirect=/account');
        }
    }, [isInitialized, user, navigate]);

    useEffect(() => {
        if (!user) return;

        const loadOrders = async () => {
            try {
                setIsLoading(true);

                const response = await fetch('/api/user/orders');
                const data = await response.json() as OrdersResponse;

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Ошибка загрузки заказов');
                }

                setOrders(data.orders ?? []);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        loadOrders();
    }, [user]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', {
            method: 'POST',
        });

        dispatch(clearUser());
        navigate('/');
    };

    if (!isInitialized) {
        return null;
    }

    if (!user) {
        return null;
    }

    return (
        <>
            <Header />
            <Navbar />
            <LocationBasketSwitcher />

            <main className="profile-page">
                <section className="profile-card">
                    <h1>Личный кабинет</h1>

                    <div className="profile-info">
                        <p>
                            <strong>Email:</strong> {user.email}
                        </p>

                        {user.name && (
                            <p>
                                <strong>Имя:</strong> {user.name}
                            </p>
                        )}

                        {user.phone && (
                            <p>
                                <strong>Телефон:</strong> {user.phone}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        className="profile-logout"
                        onClick={handleLogout}
                    >
                        Выйти
                    </button>
                </section>

                <section className="profile-orders">
                    <h2>Мои заказы</h2>

                    {isLoading && <p>Загрузка заказов...</p>}

                    {!isLoading && orders.length === 0 && (
                        <div className="profile-empty">
                            <p>У вас пока нет заказов</p>
                            <Link to="/">Перейти к покупкам</Link>
                        </div>
                    )}

                    {!isLoading && orders.map((order) => (
                        <article key={order.id} className="profile-order">
                            <div className="profile-order__top">
                                <h3>{order.order_number}</h3>

                                <span className="profile-order__status">
                                    {getStatusText(order.status)}
                                </span>
                            </div>

                            <p>
                                <strong>Адрес:</strong>{' '}
                                {order.address}
                                {order.apartment ? `, ${order.apartment}` : ''}
                            </p>

                            <p>
                                <strong>Дата:</strong>{' '}
                                {new Date(order.created_at).toLocaleString('ru-RU')}
                            </p>

                            <ul className="profile-order__items">
                                {order.items.map((item) => (
                                    <li key={item.id}>
                                        {item.title} × {item.quantity} —{' '}
                                        {item.price * item.quantity} ₽
                                    </li>
                                ))}
                            </ul>

                            <div className="profile-order__total">
                                Итого: {order.total} ₽
                            </div>
                        </article>
                    ))}
                </section>
            </main>
        </>
    );
}