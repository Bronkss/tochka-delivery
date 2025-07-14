import Header from '../components/Header.tsx'
import Navbar from "../components/Navbar.tsx";
import MainContent from "../components/MainContent.tsx";
import LocationBasketSwitcher from "../components/LocationBasketSwitcher.tsx";

function Home() {
    return (
        <>
            <Header />
            <Navbar />
            <MainContent />
            <LocationBasketSwitcher />
        </>
    )
}

export default Home;
