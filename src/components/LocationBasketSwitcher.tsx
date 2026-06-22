import Basket from './Basket';
import AddressMapPicker from './Map';

function LocationBasketSwitcher() {
    return (
        <aside className="location-basket-switcher">
            <AddressMapPicker />
            <Basket />
        </aside>
    );
}

export default LocationBasketSwitcher;