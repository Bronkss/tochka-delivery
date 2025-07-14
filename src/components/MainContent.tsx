import '../styles/components/MainContent.css'
import CategoryCard from "./CategoryCard.tsx";

function MainContent() {
    return (
        <>
            <section className="main-content">
                <h1 className="main-content__title"><span>Доставка</span> от 20 минут</h1>
                <div className="main-content__category">
                    <h2 className="main-content__category__gotovaya-eda">Готовая еда</h2>
                    <CategoryCard name="Бургеры" imageUrl="https://pngimg.com/uploads/burger_king/burger_king_PNG15.png"/>
                    <CategoryCard name="Бургеры" imageUrl="https://pngimg.com/uploads/burger_king/burger_king_PNG15.png"/>
                    <CategoryCard name="Бургеры" imageUrl="https://pngimg.com/uploads/burger_king/burger_king_PNG15.png"/>
                    <CategoryCard name="Бургеры" imageUrl="https://pngimg.com/uploads/burger_king/burger_king_PNG15.png"/>
                    <CategoryCard name="Бургеры" imageUrl="https://pngimg.com/uploads/burger_king/burger_king_PNG15.png"/>
                    <CategoryCard name="Бургеры" imageUrl="https://pngimg.com/uploads/burger_king/burger_king_PNG15.png"/>
                </div>
            </section>
        </>
    )
}

export default MainContent;