import { useState, useEffect, useRef} from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import YandexMaps from "./YandexMaps.tsx";

export default function YandexMapsPreview() {
    const { value: savedAddress, isValid, buttonCheck } = useSelector((state: RootState) => state.address);
    const [showWarning, setShowWarning] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const headerRef = useRef<HTMLElement | null>(null);
    const productsCardRef = useRef<HTMLElement | null>(null);
    const originalHeaderZIndexRef = useRef<string>('');
    const originalProductsZIndexRef = useRef<string>('');

    const getCurrentZIndex = (element: HTMLElement): number => {
        const zIndex = window.getComputedStyle(element).zIndex;
        return zIndex === 'auto' ? 0 : parseInt(zIndex, 10);
    };

    useEffect(() => {
        headerRef.current = document.querySelector('header');
        productsCardRef.current = document.querySelector('.products-content'); // Изменил селектор

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
                productsCardRef.current.style.zIndex = '1'; // Исходное значение 0
            }
            originalProductsZIndexRef.current = productsCardRef.current.style.zIndex || '1';
        }

        return () => {
            if (showModal) {
                if (headerRef.current) {
                    headerRef.current.style.zIndex = originalHeaderZIndexRef.current;
                }
                if (productsCardRef.current) {
                    productsCardRef.current.style.zIndex = originalProductsZIndexRef.current;
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

            if (productsCardRef.current) {
                productsCardRef.current.style.zIndex = '-1'; // Устанавливаем -1 при открытии
            }
        } else {
            document.body.classList.remove('body-no-scroll');

            if (headerRef.current && getCurrentZIndex(headerRef.current) === 0) {
                headerRef.current.style.zIndex = originalHeaderZIndexRef.current;
            }

            if (productsCardRef.current) {
                productsCardRef.current.style.zIndex = originalProductsZIndexRef.current; // Возвращаем исходное значение
            }
        }
    }, [showModal]);

    // Если адрес корректен, валиден и подтверждён - то скрываем компонент.
    if (savedAddress && isValid && buttonCheck) {
        return null;
    }

    function handleClickFirstButton() {
        setShowModal(true);
    }

    function handleClickSecondButton() {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
    }

    function closeModal() {
        setShowModal(false);
    }

    return (
        <div className="yandexMaps-preview">
            {/* Блок с предупреждением */}
            {showWarning && (
                <div className="overlay">
                    <div className="warning-block">
                        <p>Доставка возможна только по <br/>с. Николаевка Иркутской области</p>
                    </div>
                </div>
            )}

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

            <div className="yandexMaps-preview__info">
                <p className="yandexMaps-preview__info__title">Вы живете в с. Николаевка?</p>
                <div className="yandexMaps-preview__info__button-block">
                    <button
                        className="yandexMaps-preview__info__button-block__first-button"
                        onClick={handleClickFirstButton}
                    >
                        Да, верно
                    </button>
                    <button
                        className="yandexMaps-preview__info__button-block__second-button"
                        onClick={handleClickSecondButton}
                    >
                        Нет, другой
                    </button>
                </div>
            </div>
            <iframe
                src="https://yandex.ru/map-widget/v1/?um=constructor%3A2730706986e795b034721438b4988d3622fa7230b2792bfb0acfca6fb8adf7a3&amp;source=constructor"
                title="Yandex Map"
            />
        </div>
    )
}