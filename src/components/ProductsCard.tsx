import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import type { AppDispatch } from '../app/store';
import { addToBasket } from '../app/basketSlice';

import addIcon from '../assets/icons/add-to-basket.svg';

interface ProductsCardProps {
    id: string;
    title: string;
    image?: string | null;
    weight: number | string;
    price: number;
}

const PRODUCT_PLACEHOLDER = '/product-placeholder.png';

function getSafeImageSrc(image?: string | null): string {
    if (typeof image !== 'string') {
        return PRODUCT_PLACEHOLDER;
    }

    const value = image.trim();

    if (!value) {
        return PRODUCT_PLACEHOLDER;
    }

    return value;
}

export default function ProductsCard({
                                         id,
                                         title,
                                         image,
                                         weight,
                                         price,
                                     }: ProductsCardProps) {
    const dispatch = useDispatch<AppDispatch>();

    const [imageSrc, setImageSrc] = useState<string>(() =>
        getSafeImageSrc(image)
    );

    useEffect(() => {
        setImageSrc(getSafeImageSrc(image));
    }, [image]);

    const handleImageError = () => {
        setImageSrc(PRODUCT_PLACEHOLDER);
    };

    const handleAddToBasket = () => {
        dispatch(addToBasket({
            id,
            title,
            image: imageSrc,
            weight: String(weight || ''),
            price,
        }));
    };

    return (
        <article className="product-card">
            <div className="product-card__image-block">
                <img
                    className="product-card__image products-card__image"
                    src={imageSrc}
                    alt={title}
                    loading="lazy"
                    onError={handleImageError}
                />
            </div>

            <div className="product-card__content">
                <h3 className="product-card__title">
                    {title}
                </h3>

                {Boolean(weight) && Number(weight) !== 0 && (
                    <span className="product-card__weight">
                        {weight}
                    </span>
                )}

                <div className="product-card__bottom">
                    <span className="product-card__price">
                        {price} ₽
                    </span>

                    <button
                        type="button"
                        className="product-card__add-button"
                        onClick={handleAddToBasket}
                        aria-label={`Добавить ${title} в корзину`}
                    >
                        <img src={addIcon} alt="" />
                    </button>
                </div>
            </div>
        </article>
    );
}