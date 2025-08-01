import {useDispatch, useSelector} from 'react-redux';
import type {RootState} from '../app/store';
import {addToBasket, removeFromBasket} from '../app/basketSlice';
import addIcon from '../assets/icons/add-to-basket.svg';
import removeIcon from '../assets/icons/remove-from-basket.svg';
import defaultImage from '../assets/videos/defaultAnimation.mp4'

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

    if (props.stock !== 0) {
        return (
            <div className="product-card">
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