import Header from "../../components/Header.tsx";
import Navbar from "../../components/Navbar.tsx";
import LocationBasketSwitcher from "../../components/LocationBasketSwitcher.tsx";
import ProductsContent from "../../components/ProductsContent.tsx";
import ProductsCard from "../../components/ProductsCard.tsx";
import burger from '../../assets/categories/gotovaya-eda/burger.png'

export default function HotDogs() {
    return (
        <>
            <Header />
            <Navbar/>
            <LocationBasketSwitcher/>
            <ProductsContent title="Бургеры" >
                <ProductsCard id="2" image={burger} title="Сочный бургер с сыром" weight="250 г" price={150}/>
            </ProductsContent>
        </>
    )
}
