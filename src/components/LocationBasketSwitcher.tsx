import YandexMaps from "./YandexMaps.tsx";
import Basket from "./Basket.tsx";


function LocationBasketSwitcher() {
    return (
        <>
            <div className="location-basket-switcher">
                <YandexMaps />
                <Basket />
            </div>
        </>
    )
}

export default LocationBasketSwitcher;