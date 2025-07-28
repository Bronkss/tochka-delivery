// import {useSelector} from 'react-redux';
// import type {RootState} from '../app/store.ts';
// import deliveryManIcon from '../assets/delivery-man-icon.png';
//
// export default function Basket() {
//     const address = useSelector((state: RootState) => state.address.value);
//     const isValid = useSelector((state: RootState) => state.address.isValid);
//
//     // Не показывать блок, если адрес пустой или невалидный
//     if (!address || !isValid) {
//         return null;
//     }
//
//     return (
//         <div className="basket">
//             <div className="basket__address">
//                 <span className="current-address">
//                 {address}
//                 </span>
//                 <span className="delivery-time">
//                 Доставка 20 минут
//             </span>
//             </div>
//             <div className="basket__description">
//                 <img src={deliveryManIcon} className="delivery-icon" />
//                 <span>Соберите корзину,<br/>а мы всё быстро привезём</span>
//             </div>
//             <button className="basket__preview-button">Заказ от 100 ₽</button>
//         </div>
//     );
// };


import { useSelector } from 'react-redux';
import type { RootState } from '../app/store.ts';
import deliveryManIcon from '../assets/delivery-man-icon.png';
import { removeFromBasket, addToBasket } from '../app/basketSlice';
import { useDispatch } from 'react-redux';

export default function Basket() {
    const dispatch = useDispatch();
    const address = useSelector((state: RootState) => state.address.value);
    const isValid = useSelector((state: RootState) => state.address.isValid);
    const butonCheck = useSelector((state: RootState) => state.address.buttonCheck);
    const { items, total } = useSelector((state: RootState) => state.basket);

    if (!address || !isValid || !butonCheck)  {
        return null;
    }

    const handleRemove = (title: string) => {
        dispatch(removeFromBasket(title));
    };

    return (
        <div className="basket">
            <div className="basket__address">
                <span className="current-address">{address}</span>
                <span className="delivery-time">Доставка 20 минут</span>
            </div>

            {items.length > 0 ? (
                <div className="basket__items">
                    <h3>Ваш заказ</h3>
                    <ul className="basket__list">
                        {items.map(item => (
                            <li key={item.title} className="basket__item">
                                <div className="basket__item-info">
                                    <img src={item.image} alt={item.title} className="basket__item-image" style={{width:'100px'}} />
                                    <div>
                                        <h4>{item.title}</h4>
                                        <span>{item.weight}</span>
                                    </div>
                                </div>
                                <div className="basket__item-controls">
                                    <button
                                        className="basket__item-remove"
                                        onClick={() => handleRemove(item.title)}
                                    >
                                        -
                                    </button>
                                    <span className="basket__item-quantity">{item.quantity}</span>
                                    <button
                                        className="basket__item-add"
                                        onClick={() => dispatch(addToBasket(item))}
                                    >
                                        +
                                    </button>
                                    <span className="basket__item-price">{item.price * item.quantity} ₽</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="basket__total">
                        Итого: <span>{total} ₽</span>
                    </div>
                </div>
            ) : (
                <div className="basket__description">
                    <img src={deliveryManIcon} className="delivery-icon" alt="Доставка" />
                    <span>Соберите корзину,<br/>а мы всё быстро привезём</span>
                </div>
            )}

            <button className="basket__preview-button">
                {items.length > 0 ? `Оформить заказ (${total} ₽)` : 'Заказ от 100 ₽'}
            </button>
        </div>
    );
}