import CategoryCard from "./CategoryCard.tsx";
import hotDogImage from '../assets/categories/gotovaya-eda/hot-dog.png';
import burgerImage from '../assets/categories/gotovaya-eda/burger.png'
import Footer from "./Footer.tsx";

function MainContent() {
    return (
        <>
            <section className="main-content">
                <h1 className="main-content__title"><span>Доставка</span> от 20 минут</h1>
                <div className="main-content__category">
                    {/* Блок - Готовая еда*/}
                    <div className="main-content__category__gotovaya-eda">
                        <h2>Готовая еда</h2>
                        <CategoryCard name="Хот-доги" imageUrl={hotDogImage} linkId="/category/hot-dogs"
                                      alt="фото хот-дога"/>
                        <CategoryCard name="Бургеры" imageUrl={burgerImage} linkId="/category/burgers"
                                      alt="фото бургера"/>
                    </div>
                    {/* Блок - Овощи и фрукты*/}
                    <div className="main-content__category__vegetables">
                        <h2>Овощи и фрукты</h2>
                    </div>
                </div>
                <Footer />
            </section>
        </>
    )
}

export default MainContent;