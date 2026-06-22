import CategoryCard from "./CategoryCard.tsx";
import pizzaImage from '../assets/categories/gotovaya-eda/pizzas.png';
import burgerImage from '../assets/categories/gotovaya-eda/burger.png'
import cannedFood from '../assets/categories/bailey/canned-food.png'

function MainContent() {
    return (
        <>
            <section className="main-content">
                <h1 className="main-content__title"><span>Доставка</span> от 20 минут</h1>
                <div className="main-content__category">
                    {/* Блок - Готовая еда*/}
                    <div className="main-content__category__gotovaya-eda">
                        <h2>Готовая еда</h2>
                        <CategoryCard name="Пиццы" imageUrl={pizzaImage} linkId="/category/pizzas"
                                      alt="фото пиццы"/>
                        <CategoryCard name="Бургеры" imageUrl={burgerImage} linkId="/category/burgers"
                                      alt="фото бургера"/>
                    </div>
                    {/* Блок - Овощи и фрукты*/}
                    <div className="main-content__category__vegetables">
                        <h2>Бакалея</h2>
                        <CategoryCard name="Консервы" imageUrl={cannedFood} linkId="/category/canned-food" alt="фото консерв" />
                    </div>
                </div>
            </section>
        </>
    )
}

export default MainContent;