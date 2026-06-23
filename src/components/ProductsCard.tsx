import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../app/store';
import { addToBasket, removeFromBasket } from '../app/basketSlice';

import addIcon from '../assets/icons/add-to-basket.svg';
import removeIcon from '../assets/icons/remove-from-basket.svg';

const PRODUCT_PLACEHOLDER = '/product-placeholder.png';

type ProductLike = {
    id?: string | number;
    title?: string;
    name?: string;
    price?: number;
    image?: string;
    imageUrl?: string;
    image_url?: string;
    weight?: string | number | null;
};

type ProductCardProps = ProductLike & {
    product?: ProductLike;
};

function normalizeText(value: unknown): string {
    if (value === null || value === undefined) return '';

    const text = String(value).trim();

    if (!text || text === '0' || text.toLowerCase() === 'null') {
        return '';
    }

    return text;
}

function normalizePrice(value: unknown): number {
    const price = Number(value);

    if (!Number.isFinite(price) || price < 0) {
        return 0;
    }

    return price;
}

function getSafeImage(value: unknown): string {
    const image = normalizeText(value);

    if (!image) {
        return PRODUCT_PLACEHOLDER;
    }

    return image;
}

export default function ProductCard(props: ProductCardProps) {
    const dispatch = useDispatch<AppDispatch>();

    const source = props.product ?? props;

    const title = normalizeText(source.title ?? source.name) || 'Товар';
    const id = String(source.id ?? title);
    const price = normalizePrice(source.price);
    const imageFromSource = source.image ?? source.imageUrl ?? source.image_url;
    const weight = normalizeText(source.weight);

    const [imageSrc, setImageSrc] = useState<string>(() =>
        getSafeImage(imageFromSource)
    );

    useEffect(() => {
        setImageSrc(getSafeImage(imageFromSource));
    }, [imageFromSource]);

    const basketItem = useSelector((state: RootState) =>
        state.basket.items.find(item => item.id === id)
    );

    const quantity = basketItem?.quantity ?? 0;

    const handleAdd = () => {
        dispatch(
            addToBasket({
                id,
                title,
                price,
                image: imageSrc || PRODUCT_PLACEHOLDER,
                weight,
            })
        );
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
                        if (imageSrc !== PRODUCT_PLACEHOLDER) {
                            setImageSrc(PRODUCT_PLACEHOLDER);
                        }
                    }}
                />

                {quantity > 0 && (
                    <div className="product-card__count">
                        {quantity}
                    </div>
                )}
            </div>

            <div className="product-card__content">
                <h3 className="product-card__title">
                    {title}
                </h3>

                {weight && (
                    <span className="product-card__weight">
                        {weight}
                    </span>
                )}

                {quantity > 0 ? (
                    <div className="product-card__controls">
                        <button
                            type="button"
                            className="product-card__round-button"
                            onClick={handleRemove}
                            aria-label={`Убрать ${title}`}
                        >
                            <img src={removeIcon} alt="" />
                        </button>

                        <span className="product-card__price">
                            {price} ₽
                        </span>

                        <button
                            type="button"
                            className="product-card__round-button"
                            onClick={handleAdd}
                            aria-label={`Добавить ${title}`}
                        >
                            <img src={addIcon} alt="" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="product-card__buy-button"
                        onClick={handleAdd}
                        aria-label={`Добавить ${title} в корзину`}
                    >
                        <span>{price} ₽</span>
                        <img src={addIcon} alt="" />
                    </button>
                )}
            </div>
        </article>
    );
}