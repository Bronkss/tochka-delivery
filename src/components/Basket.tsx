import {useSelector} from 'react-redux';
import type {RootState} from '../app/store.ts';
import deliveryManIcon from '../assets/delivery-man-icon.png';

export default function Basket() {
    const address = useSelector((state: RootState) => state.address.value);
    const isValid = useSelector((state: RootState) => state.address.isValid);

    // Не показывать блок, если адрес пустой или невалидный
    if (!address || !isValid) {
        return null;
    }

    return (
        <div className="basket">
            <div className="basket__address">
                <span className="current-address">
                {address}
                </span>
                <span className="delivery-time">
                Доставка 20 минут
            </span>
            </div>
            <div className="basket__description">
                <img src={deliveryManIcon} className="delivery-icon" />
                <span>Соберите корзину,<br/>а мы всё быстро привезём</span>
            </div>
            <button className="basket__preview-button">Заказ от 100 ₽</button>
        </div>
    );
};