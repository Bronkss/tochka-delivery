import Header from "../../components/Header.tsx";
import Navbar from "../../components/Navbar.tsx";
import LocationBasketSwitcher from "../../components/LocationBasketSwitcher.tsx";
import ProductsContent from "../../components/ProductsContent.tsx";
import ProductsCard from "../../components/ProductsCard.tsx";
import gotovayaEda from '../../assets/navbar-images/gotovaya-eda.png'

export default function HotDogs() {
    return (
        <>
            <Header />
            <Navbar/>
            <LocationBasketSwitcher/>
            <ProductsContent title="Хот-доги" >
                <ProductsCard image={gotovayaEda} title="Хот дог с пеперони и сыром" weight="200 г" price={100}/>
            </ProductsContent>
        </>
    )
}
