import YandexMapsPreview from "./YandexMapsPreview.tsx";
import Basket from "./Basket.tsx";



function LocationBasketSwitcher() {
    return (
        <>
            <div className="location-basket-switcher">
                <YandexMapsPreview />
                <Basket />
            </div>
        </>
    )
}

export default LocationBasketSwitcher;