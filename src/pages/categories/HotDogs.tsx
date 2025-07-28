import Header from "../../components/Header.tsx";
import Navbar from "../../components/Navbar.tsx";
import LocationBasketSwitcher from "../../components/LocationBasketSwitcher.tsx";
import ProductsContent from "../../components/ProductsContent.tsx";
import ProductsCard from "../../components/ProductsCard.tsx";
import hotDogImage from '../../assets/categories/gotovaya-eda/hot-dog.png'

export default function HotDogs() {
    return (
        <>
            <Header />
            <Navbar/>
            <LocationBasketSwitcher/>
            <ProductsContent title="Хот-доги" >
                <ProductsCard id="1" image={hotDogImage} title="Хот дог с пеперони и сыром" weight="200 г" price={100}/>
            </ProductsContent>
        </>
    )
}
