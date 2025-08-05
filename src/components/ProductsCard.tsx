import {useDispatch, useSelector} from 'react-redux';
import type {RootState} from '../app/store';
import {addToBasket, removeFromBasket} from '../app/basketSlice';
import addIcon from '../assets/icons/add-to-basket.svg';
import removeIcon from '../assets/icons/remove-from-basket.svg';
import defaultImage from '../assets/videos/defaultAnimation.mp4'
import YandexMaps from "./YandexMaps.tsx";
import {useEffect, useRef, useState} from "react";

interface ProductCardProps {
    id: string;
    title: string;
    image: string; // URL изображения
    weight: number; // Теперь число (вес в граммах)
    price: number; // Цена без копеек
    salePrices?: Array<{ // Добавляем опциональное поле для цен
        value: number;
        priceType?: {
            name: string;
        };
    }>;
    stock: number;
}

export default function ProductsCard(props: ProductCardProps) {
    const dispatch = useDispatch();
    const { value: savedAddress, isValid, buttonCheck } = useSelector((state: RootState) => state.address);
    const [showModal, setShowModal] = useState(false);
    const headerRef = useRef<HTMLElement | null>(null);
    const originalHeaderZIndexRef = useRef<string>('');

    const getCurrentZIndex = (element: HTMLElement): number => {
        const zIndex = window.getComputedStyle(element).zIndex;
        return zIndex === 'auto' ? 0 : parseInt(zIndex, 10);
    };

    useEffect(() => {
        if (showModal && isValid && buttonCheck && savedAddress) {
            setShowModal(false);
        }
    }, [isValid, buttonCheck, savedAddress, showModal]);

    useEffect(() => {
        headerRef.current = document.querySelector('header');

        if (headerRef.current) {
            const currentZIndex = getCurrentZIndex(headerRef.current);
            if (currentZIndex === 0) {
                headerRef.current.style.zIndex = '50';
            }
            originalHeaderZIndexRef.current = headerRef.current.style.zIndex || '50';
        }

        return () => {
            if (showModal) {
                if (headerRef.current) {
                    headerRef.current.style.zIndex = originalHeaderZIndexRef.current;
                }
            }
        };
    }, []);

    useEffect(() => {
        if (showModal) {
            document.body.classList.add('body-no-scroll');

            if (headerRef.current && getCurrentZIndex(headerRef.current) >= 50) {
                headerRef.current.style.zIndex = '0';
            }

        } else {
            document.body.classList.remove('body-no-scroll');

            if (headerRef.current && getCurrentZIndex(headerRef.current) === 0) {
                headerRef.current.style.zIndex = originalHeaderZIndexRef.current;
            }

        }
    }, [showModal]);

    // Получаем количество ТОЛЬКО для текущего продукта
    const count = useSelector((state: RootState) => {
        const item = state.basket.items.find(item => item.title === props.title);
        return item ? item.quantity : 0;
    });

    // Функция для получения основной цены
    const getMainPrice = () => {
        if (props.price) return props.price / 100;
        if (props.salePrices?.length) {
            const mainPrice = props.salePrices.find(p => p.priceType?.name === 'Цена продажи');
            return mainPrice ? Math.floor(mainPrice.value) : Math.floor(props.salePrices[0].value);
        }
        return 0;
    };

    const formatWeight = (weight: number) => {
        return `${weight} г`;
    };

    const handleAddClick = () => {
        if (!isValid || !buttonCheck || !savedAddress) {
            setShowModal(true); // Показываем модальное окно с картой
            return;
        }

        dispatch(addToBasket({
            id: props.id, // Важно передавать уникальный id
            title: props.title,
            image: props.image,
            weight: formatWeight(props.weight || 0), // Форматируем вес
            price: getMainPrice() // Используем вычисленную цену
        }));
    };

    const handleRemoveClick = () => {
        if (count > 0) {
            dispatch(removeFromBasket(props.title)); // Удаляем по id
        }
    };

    function closeModal() {
        setShowModal(false);
    }


    if (props.stock !== 0) {
        return (
            <div className="product-card">
                {/* Модальное окно справа */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="right-modal">
                            <button
                                className="close-modal-button"
                                onClick={closeModal}
                            >
                                ×
                            </button>
                            <div className="modal-content">
                                <YandexMaps />
                            </div>
                        </div>
                    </div>
                )}
                <div className="product-card__image-block">
                    {props.image ? <img src={props.image} className="product-card__image" alt={props.title}/> :
                        <video
                            className="product-card__default"
                            autoPlay
                            loop
                            muted
                            playsInline
                        >
                            <source src={defaultImage} type="video/mp4"/>
                        </video>}
                    {count !== 0 && (
                        <span className="count">{count}</span>
                    )}
                    {count == props.stock && (<span className="count-null">Больше нет</span>)}
                </div>
                <h3 className="products-card__title">{props.title}</h3>
                {props.weight && (
                    <span className="product-card__weight">{formatWeight(props.weight)}</span>
                )}
                <div className="product-card__pay">
                    <span className="product-card__pay__price">{getMainPrice()}&nbsp;₽</span>
                    {count > 0 ? (
                        <button
                            className="product-card__quantity-btn"
                            onClick={handleRemoveClick}
                            aria-label="Уменьшить количество"
                        >
                            <img src={removeIcon} alt=""/>
                        </button>

                    ) : null}
                    {count < props.stock ? (
                        <button
                            className="product-card__pay__add-to-basket"
                            onClick={handleAddClick}
                            aria-label="Добавить в корзину"
                        >
                            <img src={addIcon} alt=""/>
                        </button>
                    ) : null}

                </div>
            </div>
        );
    }
}