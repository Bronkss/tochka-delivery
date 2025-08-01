import {useSelector} from 'react-redux';
import type {RootState} from '../app/store.ts';
import deliveryManIcon from '../assets/delivery-man-icon.png';
import {removeFromBasket, addToBasket} from '../app/basketSlice';
import {useDispatch} from 'react-redux';
import addIcon from '../assets/icons/add-to-basket.svg';
import removeIcon from '../assets/icons/remove-from-basket.svg';
import defaultImage from "../assets/videos/defaultAnimation.mp4";

export default function Basket() {
    const dispatch = useDispatch();
    const address = useSelector((state: RootState) => state.address.value);
    const isValid = useSelector((state: RootState) => state.address.isValid);
    const buttonCheck = useSelector((state: RootState) => state.address.buttonCheck);
    const {items, total} = useSelector((state: RootState) => state.basket);

    if (!address || !isValid || !buttonCheck) {
        return null;
    }

    const handleRemove = (title: string) => {
        dispatch(removeFromBasket(title));
    };

    function handleClick() {
        alert('Оформить пока нельзя, логика еще не написана. ')
    }

    return (
        <div className="basket">
            <div className="basket__address">
                <span className="current-address">{address}</span>
                <span className="delivery-time">Доставка 20 минут</span>
            </div>

            {items.length > 0 ? (
                <div className="basket__items">
                    <ul className="basket__list">
                        {items.map(item => (
                            <li key={item.title} className="basket__item">
                                <div className="basket__item-info">
                                    <div className="basket__item-image-block">
                                        {item.image ?
                                            <img src={item.image} alt={item.title} className="basket__item-image"/> :
                                            <video
                                                className="default-basket"
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                            >
                                                <source src={defaultImage} type="video/mp4"/>
                                            </video>}
                                    </div>
                                    <div className="basket__item-description">
                                        <div className="basket__item-description__title">
                                            <h4>{item.title}</h4>
                                            <span>{item.weight}</span>
                                        </div>
                                        <div className="basket__item-controls">
                                            <div className="basket__item-controls__count-block">
                                                <button
                                                    className="basket__item-remove"
                                                    onClick={() => handleRemove(item.title)}
                                                >
                                                    <img src={removeIcon} alt=""/>
                                                </button>
                                                <span className="basket__item-quantity">{item.quantity}</span>
                                                <button
                                                    className="basket__item-add"
                                                    onClick={() => dispatch(addToBasket(item))}
                                                >
                                                    <img src={addIcon} alt=""/>
                                                </button>
                                            </div>
                                            <span className="basket__item-price">{item.price * item.quantity} ₽</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="basket__description">
                    <img src={deliveryManIcon} className="delivery-icon" alt="Доставка"/>
                    <span>Соберите корзину,<br/>а мы всё быстро привезём</span>
                </div>
            )}

            <div className="basket__order">
                {items.length > 0 && <span>Итого<span className="basket__order__total-price">{total} ₽</span></span>}
                {items.length > 0 ? (
                    <button className="basket__order__button" onClick={handleClick}>Оформить заказ</button>
                ) : <button className="basket__preview-button">Заказ от 100 ₽</button>}
            </div>
        </div>
    );
}