import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import Header from '../components/Header';
import Navbar from '../components/Navbar';
import LocationBasketSwitcher from '../components/LocationBasketSwitcher';
import UserOrders from '../components/UserOrders.tsx';

import type { AppDispatch, RootState } from '../app/store';
import { clearUser } from '../app/authSlice';

export default function Profile() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const [searchParams] = useSearchParams();

    const user = useSelector((state: RootState) => state.auth.user);
    const isInitialized = useSelector(
        (state: RootState) => state.auth.isInitialized
    );

    const activeTab = searchParams.get('tab') === 'orders'
        ? 'orders'
        : 'profile';

    useEffect(() => {
        if (!isInitialized) return;

        if (!user) {
            navigate('/auth?redirect=/account');
        }
    }, [isInitialized, user, navigate]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
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
                <div className="profile-tabs">
                    <Link
                        to="/account"
                        className={
                            activeTab === 'profile'
                                ? 'profile-tabs__button profile-tabs__button--active'
                                : 'profile-tabs__button'
                        }
                    >
                        Профиль
                    </Link>

                    <Link
                        to="/account?tab=orders"
                        className={
                            activeTab === 'orders'
                                ? 'profile-tabs__button profile-tabs__button--active'
                                : 'profile-tabs__button'
                        }
                    >
                        Мои заказы
                    </Link>
                </div>

                {activeTab === 'profile' && (
                    <section className="profile-card">
                        <div className="profile-card__header">
                            <div>
                                <h1>Личный кабинет</h1>
                                <p>Ваши контактные данные для оформления заказа</p>
                            </div>

                            {user.isVip && (
                                <div className="profile-vip-badge">
                                    VIP
                                </div>
                            )}
                        </div>

                        <div className="profile-info">
                            <div className="profile-info__row">
                                <span>Email</span>
                                <strong>{user.email}</strong>
                            </div>

                            <div className="profile-info__row">
                                <span>Имя</span>
                                <strong>{user.name || 'Не указано'}</strong>
                            </div>

                            <div className="profile-info__row">
                                <span>Телефон</span>
                                <strong>{user.phone || 'Не указан'}</strong>
                            </div>

                            <div className="profile-info__row">
                                <span>Статус</span>
                                <strong>
                                    {user.isVip
                                        ? 'VIP-аккаунт'
                                        : 'Обычный аккаунт'}
                                </strong>
                            </div>
                        </div>

                        {user.isVip && (
                            <div className="profile-vip-info">
                                Вам доступны закрытые категории каталога.
                            </div>
                        )}

                        {(!user.name || !user.phone) && (
                            <div className="profile-warning">
                                Для оформления заказа желательно указать имя и телефон.
                            </div>
                        )}

                        <button
                            type="button"
                            className="profile-logout"
                            onClick={handleLogout}
                        >
                            Выйти
                        </button>
                    </section>
                )}

                {activeTab === 'orders' && (
                    <UserOrders />
                )}
            </main>
        </>
    );
}