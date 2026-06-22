import { useEffect, useMemo, useState } from "react";
import CategoryCard from "./CategoryCard.tsx";
import type { Product } from "../types/product.ts";

export default function CategoriesList() {
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
                    throw new Error("Не удалось загрузить товары");
                }

                const data: Product[] = await response.json();

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
        const map = new Map<string, Product>();

        products.forEach(product => {
            const category = product.category?.trim();

            if (!category) return;

            if (!map.has(category)) {
                map.set(category, product);
            }
        });

        return Array.from(map.entries()).map(([categoryName, firstProduct]) => ({
            name: categoryName,
            imageUrl: firstProduct.image || "/icons/products.jpg",
            linkId: `/category/${encodeURIComponent(categoryName)}`,
        }));
    }, [products]);

    if (isLoading) {
        return <p>Загрузка категорий...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <>
            {categories.map(category => (
                <CategoryCard
                    key={category.name}
                    name={category.name}
                    imageUrl={category.imageUrl}
                    alt={category.name}
                    linkId={category.linkId}
                />
            ))}
        </>
    );
}