import { useEffect, useMemo, useState } from "react";
import CategoryCard from "./CategoryCard.tsx";
import type { Product } from "../types/product.ts";

function MainContent() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch("/api/products");

                if (!response.ok) {
                    throw new Error("Не удалось загрузить категории");
                }

                const data: Product[] = await response.json();

                console.log("Всего товаров с backend:", data.length);
                console.log("Первый товар:", data[0]);

                const categoryStats = data.reduce<Record<string, number>>((acc, product) => {
                    const category = product.category?.trim() || "БЕЗ КАТЕГОРИИ";
                    acc[category] = (acc[category] || 0) + 1;
                    return acc;
                }, {});

                console.table(categoryStats);

                setProducts(data);
            } catch (error) {
                console.error(error);
                setError("Ошибка загрузки категорий");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const categories = useMemo(() => {
        const categoriesMap = new Map<string, Product>();

        products.forEach((product) => {
            const category = product.category?.trim();

            if (!category) return;

            if (!categoriesMap.has(category)) {
                categoriesMap.set(category, product);
            }
        });

        return Array.from(categoriesMap.entries()).map(([categoryName, product]) => ({
            name: categoryName,
            imageUrl: product.image || "/icons/products.jpg",
            linkId: `/category/${encodeURIComponent(categoryName)}`,
            alt: categoryName,
        }));
    }, [products]);

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
                            key={category.name}
                            name={category.name}
                            imageUrl={category.imageUrl}
                            linkId={category.linkId}
                            alt={category.alt}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default MainContent;