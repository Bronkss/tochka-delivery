import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../app/store';
import { addToBasket, clearBasket, removeFromBasket } from '../app/basketSlice';

import deliveryManIcon from '../assets/delivery-man-icon.png';
import removeIcon from '../assets/icons/remove-from-basket.svg';
import basketIcon from '../assets/icons/basket-icon.png';
import defaultImage from '../../public/videos/defaultAnimation.mp4';
import addIcon from '../assets/icons/add-to-basket.svg';

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
    name: string;
    phone: string;
    apartment: string;
    paymentMethod: 'cash' | 'card';
    comments: string;
}

interface FormErrors {
    name?: string;
    phone?: string;
}

interface OrderData {
    address: string;
    items: Array<{
        id: string;
        title: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    customer: {
        name: string;
        phone: string;
        apartment?: string;
    };
    paymentMethod: 'cash' | 'card';
    comments?: string;
    timestamp: string;
}

interface OrderConfirmationState {
    isConfirmed: boolean;
    orderNumber?: string;
}

function BasketItem({ item, onRemove, onAdd }: BasketItemProps) {
    return (
        <li className="basket__item">
            <div className="basket__item-info">
                <div className="basket__item-image-block">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.title}
                            className="basket__item-image"
                        />
                    ) : (
                        <video className="default-basket" autoPlay loop muted playsInline>
                            <source src={defaultImage} type="video/mp4" />
                        </video>
                    )}
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

    const address = useSelector((state: RootState) => state.address.value);
    const isValid = useSelector((state: RootState) => state.address.isValid);
    const buttonCheck = useSelector((state: RootState) => state.address.buttonCheck);

    const { items, total } = useSelector((state: RootState) => state.basket);

    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isMobile, setIsMobile] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        phone: '',
        apartment: '',
        paymentMethod: 'cash',
        comments: '',
    });

    const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmationState>({
        isConfirmed: false,
        orderNumber: undefined,
    });

    const headerRef = useRef<HTMLElement | null>(null);
    const productsCardRef = useRef<HTMLElement | null>(null);
    const originalHeaderZIndexRef = useRef<string>('');
    const originalProductsZIndexRef = useRef<string>('');

    const generateOrderNumber = () => {
        return `ORD-${Math.floor(Math.random() * 1000000)
            .toString()
            .padStart(6, '0')}`;
    };

    const getCurrentZIndex = (element: HTMLElement): number => {
        const zIndex = window.getComputedStyle(element).zIndex;
        return zIndex === 'auto' ? 0 : Number.parseInt(zIndex, 10);
    };

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

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Пожалуйста, введите ваше имя';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Имя должно содержать минимум 2 символа';
        }

        const phoneRegex =
            /^(\+7|8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

        if (!formData.phone.trim()) {
            newErrors.phone = 'Пожалуйста, введите ваш телефон';
        } else if (!phoneRegex.test(formData.phone.trim())) {
            newErrors.phone = 'Введите корректный номер телефона';
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
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

    const openModal = () => {
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const sendOrderToBot = async (orderData: OrderData): Promise<boolean> => {
        try {
            const response = await fetch('http://localhost:3000/send-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Ошибка при отправке заказа:', error);
            return false;
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        const orderData: OrderData = {
            address,
            items: items.map(item => ({
                id: item.id,
                title: item.title,
                quantity: item.quantity,
                price: item.price,
            })),
            total,
            customer: {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                apartment: formData.apartment.trim() || undefined,
            },
            paymentMethod: formData.paymentMethod,
            comments: formData.comments.trim() || undefined,
            timestamp: new Date().toISOString(),
        };

        const isSuccess = await sendOrderToBot(orderData);

        setIsSubmitting(false);

        if (isSuccess) {
            setOrderConfirmation({
                isConfirmed: true,
                orderNumber: generateOrderNumber(),
            });

            closeModal();
            dispatch(clearBasket());
            return;
        }

        alert('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте ещё раз.');
    };

    const handleReturnToMain = () => {
        setOrderConfirmation({
            isConfirmed: false,
            orderNumber: undefined,
        });

        setShowModal(false);

        if (headerRef.current) {
            headerRef.current.style.zIndex = originalHeaderZIndexRef.current;
        }

        if (productsCardRef.current) {
            productsCardRef.current.style.zIndex = originalProductsZIndexRef.current;
        }

        document.body.classList.remove('body-no-scroll');

        navigate('/');
    };

    if (!address || !isValid || !buttonCheck) {
        return null;
    }

    return (
        <div className="basket">
            <div className="basket__address">
                <span className="delivery-time">Доставка 20 минут</span>
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
                {items.length > 0 && (
                    <span>
                        Итого
                        <span className="basket__order__total-price">
                            {total} ₽
                        </span>
                    </span>
                )}

                {items.length > 0 ? (
                    isMobile ? (
                        <button
                            type="button"
                            className="basket__order__button"
                            onClick={openModal}
                        >
                            <img src={basketIcon} alt="" />
                            {total} ₽
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="basket__order__button"
                            onClick={openModal}
                        >
                            Продолжить
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

                                        <div className="input-group">
                                            <label htmlFor="name">Ваше имя *</label>

                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Иван Иванов"
                                                className={errors.name ? 'error' : ''}
                                            />

                                            {errors.name && (
                                                <span className="error-message">
                                                    {errors.name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="input-group">
                                            <label htmlFor="phone">Телефон *</label>

                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="+7 (999) 123-45-67"
                                                className={errors.phone ? 'error' : ''}
                                            />

                                            {errors.phone && (
                                                <span className="error-message">
                                                    {errors.phone}
                                                </span>
                                            )}
                                        </div>

                                        <div className="input-group">
                                            <label htmlFor="apartment">
                                                Квартира / подъезд / этаж
                                            </label>

                                            <input
                                                id="apartment"
                                                name="apartment"
                                                type="text"
                                                value={formData.apartment}
                                                onChange={handleInputChange}
                                                placeholder="Например: кв. 12, подъезд 2"
                                            />
                                        </div>
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

                                    <div className="order-total">
                                        <div className="total-line">
                                            <span>Итого:</span>
                                            <span className="total-price">
                                                {total} ₽
                                            </span>
                                        </div>

                                        <button
                                            type="submit"
                                            className="submit-button"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting
                                                ? 'Отправка...'
                                                : 'Оформить заказ'}
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
                                Номер заказа: {orderConfirmation.orderNumber}
                            </p>

                            <p className="confirmation-message">
                                Ваш заказ отправлен в сборку.
                                <br />
                                Курьер скоро приедет по адресу:
                            </p>

                            <p className="delivery-address">{address}</p>

                            <button
                                type="button"
                                className="return-button"
                                onClick={handleReturnToMain}
                            >
                                Вернуться на главную
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}