import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Header from "../components/Header.tsx";
import Navbar from "../components/Navbar.tsx";
import LocationBasketSwitcher from "../components/LocationBasketSwitcher.tsx";
import ProductsContent from "../components/ProductsContent.tsx";
import ProductsCard from "../components/ProductsCard.tsx";

import type { Product } from "../types/product.ts";

export default function CategoryPages() {
    const { categoryId } = useParams<{ categoryId: string }>();

    const categoryName = categoryId
        ? decodeURIComponent(categoryId)
        : "";

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!categoryName) return;

        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch(
                    `/api/categories/${encodeURIComponent(categoryName)}/products`
                );

                if (!response.ok) {
                    throw new Error("Не удалось загрузить товары");
                }

                const data: Product[] = await response.json();

                setProducts(data);
            } catch (error) {
                console.error(error);
                setError("Ошибка загрузки товаров");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [categoryName]);

    return (
        <>
            <Header />
            <Navbar />
            <LocationBasketSwitcher />

            <ProductsContent title={categoryName}>
                {isLoading && <p>Загрузка товаров...</p>}

                {error && <p>{error}</p>}

                {!isLoading && !error && products.length === 0 && (
                    <p>Товары в этой категории не найдены</p>
                )}

                {!isLoading && !error && products.map(product => (
                    <ProductsCard
                        key={product.id}
                        id={String(product.id)}
                        title={product.name}
                        image={product.image || "/icons/products.jpg"}
                        weight={0}
                        price={Math.floor(product.sellingPrice || 0)}
                    />
                ))}
            </ProductsContent>
        </>
    );
}