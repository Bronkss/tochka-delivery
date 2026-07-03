import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../app/store';
import { addToBasket, clearBasket, removeFromBasket } from '../app/basketSlice';

import deliveryManIcon from '../assets/delivery-man-icon.png';
import removeIcon from '../assets/icons/remove-from-basket.svg';
import basketIcon from '../assets/icons/basket-icon.png';
import addIcon from '../assets/icons/add-to-basket.svg';

import { getImageUrl } from '../utils/imageProxy';

interface BasketItemProps {
    item: {
        id: string;
        title: string;
        image?: string;
        weight: string;
        price: number;
        quantity: number;
    };
    onRemove: (id: string) => void;
    onAdd: (item: {
        id: string;
        title: string;
        image?: string;
        weight: string;
        price: number;
    }) => void;
}

interface FormData {
    paymentMethod: 'cash' | 'card';
    comments: string;
}

interface OrderData {
    address: string;
    items: Array<{
        id: string;
        title: string;
        quantity: number;
        price: number;
    }>;
    productsTotal: number;
    deliveryFee: number;
    total: number;
    customer: {
        name: string;
        phone: string;
    };
    paymentMethod: 'cash' | 'card';
    comments?: string;
    timestamp: string;
}

interface OrderConfirmationState {
    isConfirmed: boolean;
    orderNumber?: string;
    deliveryAddress?: string;
}

interface CreateOrderResponse {
    success: boolean;
    orderId?: number;
    orderNumber?: string;
    telegramSent?: boolean;
    message?: string;
}

const ORDER_TIME_ZONE = 'Asia/Irkutsk';
const ORDER_OPEN_HOUR = 10;
const ORDER_CLOSE_HOUR = 22;

function getDeliveryFee(productsTotal: number): number {
    if (productsTotal <= 0) {
        return 0;
    }

    if (productsTotal >= 1000) {
        return 0;
    }

    if (productsTotal >= 500) {
        return 50;
    }

    return 100;
}

function getDeliveryFeeText(deliveryFee: number): string {
    return deliveryFee === 0 ? 'Бесплатно' : `${deliveryFee} ₽`;
}

function getOrderTimeState(date: Date) {
    const formatter = new Intl.DateTimeFormat('ru-RU', {
        timeZone: ORDER_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(date);

    const hour = Number.parseInt(
        parts.find((part) => part.type === 'hour')?.value ?? '0',
        10
    );

    const minute = Number.parseInt(
        parts.find((part) => part.type === 'minute')?.value ?? '0',
        10
    );

    const currentTime = formatter.format(date);
    const isAvailable = hour >= ORDER_OPEN_HOUR && hour < ORDER_CLOSE_HOUR;

    return {
        hour,
        minute,
        currentTime,
        isAvailable,
    };
}

function BasketItem({ item, onRemove, onAdd }: BasketItemProps) {
    const fallbackImage = '/product-placeholder.png';

    return (
        <li className="basket__item">
            <div className="basket__item-info">
                <div className="basket__item-image-block">
                    <img
                        src={getImageUrl(item.image) || fallbackImage}
                        alt={item.title}
                        className="basket__item-image"
                        onError={(event) => {
                            if (!event.currentTarget.src.endsWith(fallbackImage)) {
                                event.currentTarget.src = fallbackImage;
                            }
                        }}
                    />
                </div>

                <div className="basket__item-description">
                    <div className="basket__item-description__title">
                        <h4>{item.title}</h4>
                        {item.weight && <span>{item.weight}</span>}
                    </div>

                    <div className="basket__item-controls">
                        <div className="basket__item-controls__count-block">
                            <button
                                type="button"
                                className="basket__item-count-button"
                                onClick={() => onRemove(item.id)}
                                aria-label={`Убрать ${item.title} из корзины`}
                            >
                                <img src={removeIcon} alt="" />
                            </button>

                            <span className="basket__item-quantity">
                                {item.quantity}
                            </span>

                            <button
                                type="button"
                                className="basket__item-count-button"
                                onClick={() =>
                                    onAdd({
                                        id: item.id,
                                        title: item.title,
                                        image: item.image,
                                        weight: item.weight,
                                        price: item.price,
                                    })
                                }
                                aria-label={`Добавить ещё ${item.title}`}
                            >
                                <img src={addIcon} alt="" />
                            </button>
                        </div>

                        <span className="basket__item-price">
                            {item.price * item.quantity} ₽
                        </span>
                    </div>
                </div>
            </div>
        </li>
    );
}

export default function Basket() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const user = useSelector((state: RootState) => state.auth.user);

    const address = useSelector((state: RootState) => state.address.value);
    const isValid = useSelector((state: RootState) => state.address.isValid);
    const buttonCheck = useSelector((state: RootState) => state.address.buttonCheck);

    const { items, total } = useSelector((state: RootState) => state.basket);

    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [now, setNow] = useState(() => new Date());

    const [formData, setFormData] = useState<FormData>({
        paymentMethod: 'cash',
        comments: '',
    });

    const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmationState>({
        isConfirmed: false,
        orderNumber: undefined,
        deliveryAddress: undefined,
    });

    const headerRef = useRef<HTMLElement | null>(null);
    const productsCardRef = useRef<HTMLElement | null>(null);
    const originalHeaderZIndexRef = useRef<string>('');
    const originalProductsZIndexRef = useRef<string>('');

    const customerName = user?.name?.trim() || '';
    const customerPhone = user?.phone?.trim() || '';

    const orderTimeState = getOrderTimeState(now);
    const isOrderTimeAvailable = orderTimeState.isAvailable;

    const productsTotal = total;
    const deliveryFee = getDeliveryFee(productsTotal);
    const orderTotal = productsTotal + deliveryFee;
    const deliveryFeeText = getDeliveryFeeText(deliveryFee);

    const getCurrentZIndex = (element: HTMLElement): number => {
        const zIndex = window.getComputedStyle(element).zIndex;
        return zIndex === 'auto' ? 0 : Number.parseInt(zIndex, 10);
    };

    useEffect(() => {
        const timerId = window.setInterval(() => {
            setNow(new Date());
        }, 30000);

        return () => {
            window.clearInterval(timerId);
        };
    }, []);

    useEffect(() => {
        headerRef.current = document.querySelector('header');
        productsCardRef.current = document.querySelector('.products-content');

        if (headerRef.current) {
            const currentZIndex = getCurrentZIndex(headerRef.current);

            if (currentZIndex === 0) {
                headerRef.current.style.zIndex = '50';
            }

            originalHeaderZIndexRef.current = headerRef.current.style.zIndex || '50';
        }

        if (productsCardRef.current) {
            const currentZIndex = getCurrentZIndex(productsCardRef.current);

            if (currentZIndex === 0) {
                productsCardRef.current.style.zIndex = '1';
            }

            originalProductsZIndexRef.current =
                productsCardRef.current.style.zIndex || '1';
        }

        return () => {
            if (headerRef.current) {
                headerRef.current.style.zIndex = originalHeaderZIndexRef.current;
            }

            if (productsCardRef.current) {
                productsCardRef.current.style.zIndex = originalProductsZIndexRef.current;
            }

            document.body.classList.remove('body-no-scroll');
        };
    }, []);

    useEffect(() => {
        const hasActiveModal = showModal || orderConfirmation.isConfirmed;

        if (hasActiveModal) {
            document.body.classList.add('body-no-scroll');

            if (headerRef.current && getCurrentZIndex(headerRef.current) >= 50) {
                headerRef.current.style.zIndex = '0';
            }

            if (productsCardRef.current) {
                productsCardRef.current.style.zIndex = '-1';
            }
        } else {
            document.body.classList.remove('body-no-scroll');

            if (headerRef.current) {
                headerRef.current.style.zIndex = originalHeaderZIndexRef.current;
            }

            if (productsCardRef.current) {
                productsCardRef.current.style.zIndex = originalProductsZIndexRef.current;
            }
        }
    }, [showModal, orderConfirmation.isConfirmed]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleInputChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePaymentChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            paymentMethod: event.target.value as 'cash' | 'card',
        }));
    };

    const handleRemove = (id: string) => {
        dispatch(removeFromBasket(id));
    };

    const handleAdd = (item: {
        id: string;
        title: string;
        image?: string;
        weight: string;
        price: number;
    }) => {
        dispatch(addToBasket(item));
    };

    const showClosedAlert = () => {
        alert('Заказы принимаем с 10:00 до 22:00 по местному времени.');
    };

    const openModal = () => {
        if (!isOrderTimeAvailable) {
            showClosedAlert();
            return;
        }

        if (!user) {
            navigate('/auth');
            return;
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const sendOrderToBot = async (
        orderData: OrderData
    ): Promise<CreateOrderResponse> => {
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(orderData),
            });

            const text = await response.text();

            let data: CreateOrderResponse;

            try {
                data = JSON.parse(text) as CreateOrderResponse;
            } catch {
                console.error('Сервер вернул не JSON:', text);

                return {
                    success: false,
                    message: 'Сервер вернул ошибку. Проверь Vercel Function Logs.',
                };
            }

            if (!response.ok || !data.success) {
                return {
                    success: false,
                    message: data.message || `Ошибка сервера: ${response.status}`,
                };
            }

            return data;
        } catch (error) {
            console.error('Ошибка при отправке заказа:', error);

            return {
                success: false,
                message: 'Не удалось отправить заказ. Проверь подключение к серверу.',
            };
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!isOrderTimeAvailable) {
            showClosedAlert();
            return;
        }

        if (!user) {
            navigate('/auth');
            return;
        }

        if (!customerName) {
            alert('В аккаунте не указано имя. Заполните имя в личном кабинете.');
            return;
        }

        if (!customerPhone) {
            alert('В аккаунте не указан телефон. Заполните телефон в личном кабинете.');
            return;
        }

        if (items.length === 0) {
            alert('Корзина пуста');
            return;
        }

        if (productsTotal < 100) {
            alert('Минимальная сумма заказа — 100 ₽ без учёта доставки');
            return;
        }

        setIsSubmitting(true);

        const deliveryAddress = address;

        const orderData: OrderData = {
            address,
            items: items.map(item => ({
                id: item.id,
                title: item.title,
                quantity: item.quantity,
                price: item.price,
            })),
            productsTotal,
            deliveryFee,
            total: orderTotal,
            customer: {
                name: customerName,
                phone: customerPhone,
            },
            paymentMethod: formData.paymentMethod,
            comments: formData.comments.trim() || undefined,
            timestamp: new Date().toISOString(),
        };

        const result = await sendOrderToBot(orderData);

        setIsSubmitting(false);

        if (result.success) {
            setOrderConfirmation({
                isConfirmed: true,
                orderNumber: result.orderNumber,
                deliveryAddress,
            });

            closeModal();
            dispatch(clearBasket());

            if (!result.telegramSent) {
                console.warn('Заказ создан, но сообщение в Telegram не отправилось');
            }

            return;
        }

        alert(
            result.message ||
            'Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте ещё раз.'
        );
    };

    const handleGoToOrders = () => {
        setOrderConfirmation({
            isConfirmed: false,
            orderNumber: undefined,
            deliveryAddress: undefined,
        });

        setShowModal(false);

        if (headerRef.current) {
            headerRef.current.style.zIndex = originalHeaderZIndexRef.current;
        }

        if (productsCardRef.current) {
            productsCardRef.current.style.zIndex = originalProductsZIndexRef.current;
        }

        document.body.classList.remove('body-no-scroll');

        navigate('/account?tab=orders');
    };

    if (!address || !isValid || !buttonCheck) {
        return null;
    }

    return (
        <div className="basket">
            <div className="basket__address">
                <span
                    className={
                        isOrderTimeAvailable
                            ? 'delivery-time'
                            : 'delivery-time delivery-time--closed'
                    }
                >
                    {isOrderTimeAvailable
                        ? 'Доставка 20 минут'
                        : 'Заказы с 10:00 до 22:00'}
                </span>
            </div>

            {items.length > 0 ? (
                <div className="basket__items">
                    <ul className="basket__list">
                        {items.map(item => (
                            <BasketItem
                                key={item.id}
                                item={item}
                                onRemove={handleRemove}
                                onAdd={handleAdd}
                            />
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="basket__description">
                    <img
                        src={deliveryManIcon}
                        className="delivery-icon"
                        alt="Доставка"
                    />
                    <span>
                        Соберите корзину,
                        <br />
                        а мы всё быстро привезём
                    </span>
                </div>
            )}

            <div className="basket__order">
                {items.length > 0 ? (
                    isMobile ? (
                        <button
                            type="button"
                            className="basket__order__button"
                            onClick={openModal}
                            disabled={!isOrderTimeAvailable}
                        >
                            <img src={basketIcon} alt="" />

                            {isOrderTimeAvailable
                                ? `${productsTotal} ₽`
                                : 'Закрыто'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="basket__order__button"
                            onClick={openModal}
                            disabled={!isOrderTimeAvailable}
                        >
                            {isOrderTimeAvailable
                                ? `Продолжить · ${productsTotal} ₽`
                                : 'Заказы с 10:00 до 22:00'}
                        </button>
                    )
                ) : (
                    <button type="button" className="basket__preview-button">
                        Заказ от 100 ₽
                    </button>
                )}
            </div>

            {showModal && !orderConfirmation.isConfirmed && (
                <div className="modal-overlay__basket">
                    <div className="right-modal__basket">
                        <div className="modal-header">
                            <h2>Оформление заказа</h2>

                            <button
                                type="button"
                                className="close-button"
                                onClick={closeModal}
                                aria-label="Закрыть оформление заказа"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="delivery-info">
                            <div className="address-block">
                                <svg className="icon" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>

                                <span>{address}</span>
                            </div>

                            <div className="time-block">
                                <svg className="icon" viewBox="0 0 24 24">
                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                                    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                </svg>

                                <span>Доставка: 20 минут</span>
                            </div>
                        </div>

                        <div className="modal-content__basket">
                            <div className="order-column">
                                <h3>Ваш заказ</h3>

                                <ul className="order-list">
                                    {items.map(item => (
                                        <BasketItem
                                            key={item.id}
                                            item={item}
                                            onRemove={handleRemove}
                                            onAdd={handleAdd}
                                        />
                                    ))}
                                </ul>
                            </div>

                            <div className="form-column">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-section">
                                        <h3>Контактные данные</h3>

                                        <div className="account-contact">
                                            <div className="account-contact__row">
                                                <span>Имя</span>
                                                <strong>
                                                    {customerName || 'Не указано'}
                                                </strong>
                                            </div>

                                            <div className="account-contact__row">
                                                <span>Телефон</span>
                                                <strong>
                                                    {customerPhone || 'Не указан'}
                                                </strong>
                                            </div>
                                        </div>

                                        {(!customerName || !customerPhone) && (
                                            <p className="account-contact__warning">
                                                Для оформления заказа в аккаунте должны быть указаны имя и телефон.
                                            </p>
                                        )}
                                    </div>

                                    <div className="payment-section">
                                        <h3>Способ оплаты</h3>

                                        <div className="payment-options">
                                            <label className="payment-option">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="cash"
                                                    checked={formData.paymentMethod === 'cash'}
                                                    onChange={handlePaymentChange}
                                                />

                                                <span>Наличными курьеру</span>
                                            </label>

                                            <label className="payment-option">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="card"
                                                    checked={formData.paymentMethod === 'card'}
                                                    onChange={handlePaymentChange}
                                                />

                                                <span>Картой курьеру</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="comments-section">
                                        <label htmlFor="comments">
                                            Комментарий к заказу
                                        </label>

                                        <textarea
                                            id="comments"
                                            name="comments"
                                            value={formData.comments}
                                            onChange={handleInputChange}
                                            placeholder="Например: позвоните за 5 минут до доставки"
                                            rows={3}
                                        />
                                    </div>

                                    {!isOrderTimeAvailable && (
                                        <p className="order-time-warning">
                                            Сейчас заказы не принимаются. Оформление доступно с 10:00 до 22:00.
                                        </p>
                                    )}

                                    <div className="order-total">
                                        <div className="total-line">
                                            <span>Товары:</span>
                                            <span>{productsTotal} ₽</span>
                                        </div>

                                        <div className="total-line">
                                            <span>Доставка:</span>
                                            <span>{deliveryFeeText}</span>
                                        </div>

                                        <div className="total-line total-line--final">
                                            <span>Итого:</span>
                                            <span className="total-price">
                                                {orderTotal} ₽
                                            </span>
                                        </div>

                                        <button
                                            type="submit"
                                            className="submit-button"
                                            disabled={
                                                isSubmitting ||
                                                !customerName ||
                                                !customerPhone ||
                                                !isOrderTimeAvailable
                                            }
                                        >
                                            {isSubmitting
                                                ? 'Отправка...'
                                                : isOrderTimeAvailable
                                                    ? 'Оформить заказ'
                                                    : 'Заказы с 10:00 до 22:00'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {orderConfirmation.isConfirmed && (
                <div className="modal-overlay__basket confirmation-modal">
                    <div className="right-modal__basket">
                        <div className="confirmation-content">
                            <svg className="confirmation-icon" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                                />
                            </svg>

                            <h2>Заказ принят!</h2>

                            <p className="order-number">
                                Номер заказа: {orderConfirmation.orderNumber || 'создаётся'}
                            </p>

                            <p className="confirmation-message">
                                Ваш заказ отправлен в сборку.
                                <br />
                                Курьер скоро приедет по адресу:
                            </p>

                            <p className="delivery-address">
                                {orderConfirmation.deliveryAddress || address}
                            </p>

                            <button
                                type="button"
                                className="return-button"
                                onClick={handleGoToOrders}
                            >
                                Перейти в мои заказы
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}