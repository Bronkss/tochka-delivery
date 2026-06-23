import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../app/store';
import { addToBasket, removeFromBasket } from '../app/basketSlice';

import addIcon from '../assets/icons/add-to-basket.svg';
import removeIcon from '../assets/icons/remove-from-basket.svg';

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

    const basketItem = useSelector((state: RootState) =>
        state.basket.items.find(item => item.id === id)
    );

    const quantity = basketItem?.quantity ?? 0;

    const [imageSrc, setImageSrc] = useState<string>(() =>
        getSafeImageSrc(image)
    );

    useEffect(() => {
        setImageSrc(getSafeImageSrc(image));
    }, [image]);

    const handleAdd = () => {
        dispatch(addToBasket({
            id,
            title,
            image: imageSrc,
            weight: String(weight || ''),
            price,
        }));
    };

    const handleRemove = () => {
        dispatch(removeFromBasket(id));
    };

    return (
        <article className="product-card">
            <div className="product-card__image-block">
                <img
                    className="product-card__image products-card__image"
                    src={imageSrc}
                    alt={title}
                    loading="lazy"
                    onError={() => {
                        setImageSrc(PRODUCT_PLACEHOLDER);
                    }}
                />
            </div>

            <div className="product-card__description">
                <h3>{title}</h3>

                {Boolean(weight) && Number(weight) !== 0 && (
                    <span className="product-card__weight">
                        {weight}
                    </span>
                )}
            </div>

            <div className="product-card__footer">
                <span className="product-card__price">
                    {price} ₽
                </span>

                {quantity > 0 ? (
                    <div className="product-card__counter">
                        <button
                            type="button"
                            className="product-card__counter-button"
                            onClick={handleRemove}
                            aria-label={`Убрать ${title} из корзины`}
                        >
                            <img src={removeIcon} alt="" />
                        </button>

                        <span className="product-card__quantity">
                            {quantity}
                        </span>

                        <button
                            type="button"
                            className="product-card__counter-button"
                            onClick={handleAdd}
                            aria-label={`Добавить ещё ${title}`}
                        >
                            <img src={addIcon} alt="" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="product-card__add-button"
                        onClick={handleAdd}
                        aria-label={`Добавить ${title} в корзину`}
                    >
                        <img src={addIcon} alt="" />
                    </button>
                )}
            </div>
        </article>
    );
}