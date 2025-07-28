import CategoryCard from "./CategoryCard.tsx";
import hotDogImage from '../assets/navbar-images/gotovaya-eda.png';
import burgerImage from '../assets/navbar-images/burger.png'

function MainContent() {
    return (
        <>
            <section className="main-content">
                <h1 className="main-content__title"><span>Доставка</span> от 20 минут</h1>
                <div className="main-content__category">
                    <h2 className="main-content__category__gotovaya-eda">Готовая еда</h2>
                    <CategoryCard name="Хот-доги" imageUrl={hotDogImage} linkId="/category/hot-dogs" />
                    <CategoryCard name="Бургеры" imageUrl={burgerImage} linkId="/category/burgers" />
                </div>
            </section>
        </>
    )
}

export default MainContent;