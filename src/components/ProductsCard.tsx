// import { useState } from 'react';
// import addIcon from '../assets/icons/add-to-basket.svg';
// import removeIcon from '../assets/icons/remove-from-basket.svg'; // Нужно добавить эту иконку
//
// interface ProductCardProps {
//     title?: string;
//     image?: string;
//     weight?: string;
//     price?: number;
// }
//
// export default function ProductsCard(props: ProductCardProps) {
//     const [count, setCount] = useState(0);
//
//     function handleAddClick() {
//         setCount(prevCount => prevCount + 1);
//     }
//
//     function handleRemoveClick() {
//         setCount(prevCount => (prevCount > 0 ? prevCount - 1 : 0));
//     }
//
//     return (
//         <div className="product-card">
//             <div className="product-card__image-block">
//                 <img src={props.image} className="product-card__image" alt={props.title} />
//             </div>
//             <h3 className="products-card__title">{props.title}</h3>
//             <span className="product-card__weight">{props.weight}</span>
//             <div className="product-card__pay">
//                 <span className="product-card__pay__price">{props.price + " ₽"}</span>
//                 <div className="product-card__quantity-controls">
//                     {count > 0 && (
//                         <>
//                             <button
//                                 className="product-card__quantity-btn"
//                                 onClick={handleRemoveClick}
//                             >
//                                 <img src={removeIcon} alt="Уменьшить" />
//                             </button>
//                             <span className="product-card__quantity-count">{count}</span>
//                         </>
//                     )}
//                     <button
//                         className="product-card__pay__add-to-basket"
//                         onClick={handleAddClick}
//                     >
//                         <img src={addIcon} alt="Добавить" />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// import { useDispatch } from 'react-redux';
// import { addToBasket } from '../app/basketSlice';
// import addIcon from '../assets/icons/add-to-basket.svg';
// // import removeIcon from '../assets/icons/remove-from-basket.svg';
//
// interface ProductCardProps {
//     id: string;
//     title: string;
//     image: string;
//     weight: string;
//     price: number;
// }
//
// export default function ProductsCard(props: ProductCardProps) {
//     const dispatch = useDispatch();
//
//     const handleAddClick = () => {
//         dispatch(addToBasket({
//             id: props.id,
//             title: props.title,
//             image: props.image,
//             weight: props.weight,
//             price: props.price
//         }));
//     };
//
//     return (
//         <div className="product-card">
//             <div className="product-card__image-block">
//                 <img src={props.image} className="product-card__image" alt={props.title} />
//             </div>
//             <h3 className="products-card__title">{props.title}</h3>
//             <span className="product-card__weight">{props.weight}</span>
//             <div className="product-card__pay">
//                 <span className="product-card__pay__price">{props.price} ₽</span>
//                 <button
//                     className="product-card__pay__add-to-basket"
//                     onClick={handleAddClick}
//                 >
//                     <img src={addIcon} alt="Добавить в корзину" />
//                 </button>
//             </div>
//         </div>
//     );
// }

import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { addToBasket, removeFromBasket } from '../app/basketSlice';
import addIcon from '../assets/icons/add-to-basket.svg';
import removeIcon from '../assets/icons/remove-from-basket.svg';

interface ProductCardProps {
    id: string; // Убедитесь, что id уникален для каждого продукта
    title: string;
    image: string;
    weight: string;
    price: number;
}

export default function ProductsCard(props: ProductCardProps) {
    const dispatch = useDispatch();

    // Получаем количество ТОЛЬКО для текущего продукта
    const count = useSelector((state: RootState) => {
        const item = state.basket.items.find(item => item.title === props.title);
        return item ? item.quantity : 0;
    });

    const handleAddClick = () => {
        dispatch(addToBasket({
            id: props.id, // Важно передавать уникальный id
            title: props.title,
            image: props.image,
            weight: props.weight,
            price: props.price
        }));
    };

    const handleRemoveClick = () => {
        if (count > 0) {
            dispatch(removeFromBasket(props.title)); // Удаляем по id
        }
    };

    return (
        <div className="product-card">
            <div className="product-card__image-block">
                <img src={props.image} className="product-card__image" alt={props.title} />
            </div>
            <h3 className="products-card__title">{props.title}</h3>
            <span className="product-card__weight">{props.weight}</span>
            <div className="product-card__pay">
                <span className="product-card__pay__price">{props.price} ₽</span>
                <div className="product-card__quantity-controls">
                    {count > 0 ? (
                        <>
                            <button
                                className="product-card__quantity-btn"
                                onClick={handleRemoveClick}
                                aria-label="Уменьшить количество"
                            >
                                <img src={removeIcon} alt="" />
                            </button>
                            <span className="product-card__quantity-count">{count}</span>
                        </>
                    ) : null}
                    <button
                        className="product-card__pay__add-to-basket"
                        onClick={handleAddClick}
                        aria-label="Добавить в корзину"
                    >
                        <img src={addIcon} alt="" />
                    </button>
                </div>
            </div>
        </div>
    );
}