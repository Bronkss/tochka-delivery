import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../app/store';
import { addToBasket, removeFromBasket } from '../app/basketSlice';

import addIcon from '../assets/icons/add-to-basket.svg';
import removeIcon from '../assets/icons/remove-from-basket.svg';
import defaultImage from '../../public/videos/defaultAnimation.mp4';

type ProductLike = {
    id?: string | number;
    title?: string;
    name?: string;
    price?: number;
    image?: string;
    imageUrl?: string;
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

export default function ProductCard(props: ProductCardProps) {
    const dispatch = useDispatch<AppDispatch>();

    const source = props.product ?? props;

    const title = normalizeText(source.title ?? source.name) || 'Товар';
    const id = String(source.id ?? title);
    const price = normalizePrice(source.price);
    const image = normalizeText(source.image ?? source.imageUrl);
    const weight = normalizeText(source.weight);

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
                image: image || undefined,
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
                {image ? (
                    <img
                        className="products-card__image"
                        src={image || "/product-placeholder.png"}
                        alt={title}
                        onError={(event) => {
                            event.currentTarget.src = "/product-placeholder.png";
                        }}
                    />
                ) : (
                    <video
                        className="product-card__default"
                        autoPlay
                        loop
                        muted
                        playsInline
                    >
                        <source src={defaultImage} type="video/mp4" />
                    </video>
                )}

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