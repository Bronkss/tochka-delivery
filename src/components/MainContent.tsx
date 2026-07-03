import { useEffect, useState } from "react";
import CategoryCard from "./CategoryCard.tsx";
import Footer from "./Footer.tsx";

interface Category {
    id: string;
    name: string;
    image: string;
    productsCount: number;
}

const CATEGORY_PLACEHOLDER = "/product-placeholder.png";

function MainContent() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch("/api/categories");

                if (!response.ok) {
                    throw new Error("Не удалось загрузить категории");
                }

                const data: Category[] = await response.json();

                const visibleCategories = data
                    .filter((category) => category.name?.trim())
                    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

                console.log("Категорий с backend:", visibleCategories.length);
                console.log("Первая категория:", visibleCategories[0]);

                setCategories(visibleCategories);
            } catch (error) {
                console.error("Ошибка загрузки категорий:", error);
                setError("Ошибка загрузки категорий");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return (
        <section className="main-content">
            <h1 className="main-content__title">
                <span>Доставка</span> от 20 минут
            </h1>

            <div className="main-content__category">
                <div className="main-content__category__gotovaya-eda">
                    <h2>Категории</h2>

                    {isLoading && <p>Загрузка категорий...</p>}
                    {error && <p>{error}</p>}

                    {!isLoading && !error && categories.length === 0 && (
                        <p>Категории не найдены</p>
                    )}

                    {!isLoading && !error && categories.map((category) => (
                        <CategoryCard
                            key={category.id || category.name}
                            name={category.name}
                            imageUrl={category.image || CATEGORY_PLACEHOLDER}
                            linkId={`/category/${encodeURIComponent(category.name)}`}
                            alt={category.name}
                        />
                    ))}
                </div>
            </div>

            <Footer />
        </section>
    );
}

export default MainContent;