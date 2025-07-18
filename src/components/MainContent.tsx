import CategoryCard from "./CategoryCard.tsx";
import gotovayaEdaImage from '../assets/navbar-images/gotovaya-eda.png';

function MainContent() {
    return (
        <>
            <section className="main-content">
                <h1 className="main-content__title"><span>Доставка</span> от 20 минут</h1>
                <div className="main-content__category">
                    <h2 className="main-content__category__gotovaya-eda">Готовая еда</h2>
                    <CategoryCard name="Хот-доги" imageUrl={gotovayaEdaImage} alt="фото Хот-дога" linkId="/category/hot-dogs" />
                </div>
            </section>
        </>
    )
}

export default MainContent;