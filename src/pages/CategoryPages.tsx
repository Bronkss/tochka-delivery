import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import Header from "../components/Header.tsx";
import Navbar from "../components/Navbar.tsx";
import LocationBasketSwitcher from "../components/LocationBasketSwitcher.tsx";
import ProductsContent from "../components/ProductsContent.tsx";
import ProductsCard from "../components/ProductsCard.tsx";

import type { Product } from "../types/product.ts";

function normalizeSearchText(value: string) {
    return value
        .toLowerCase()
        .replaceAll("ё", "е")
        .trim();
}

export default function CategoryPages() {
    const { categoryId } = useParams<{ categoryId: string }>();
    const [searchParams] = useSearchParams();

    const searchQuery = searchParams.get("search") ?? "";

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

    const visibleProducts = useMemo(() => {
        const normalizedQuery = normalizeSearchText(searchQuery);

        if (!normalizedQuery) {
            return products;
        }

        return products.filter((product) => {
            const productName = normalizeSearchText(product.name ?? "");
            const productCategory = normalizeSearchText(categoryName);

            return (
                productName.includes(normalizedQuery) ||
                productCategory.includes(normalizedQuery)
            );
        });
    }, [products, searchQuery, categoryName]);

    const pageTitle = searchQuery
        ? `Поиск: ${searchQuery}`
        : categoryName;

    return (
        <>
            <Header />
            <Navbar />
            <LocationBasketSwitcher />

            <ProductsContent title={pageTitle}>
                {isLoading && <p>Загрузка товаров...</p>}

                {error && <p>{error}</p>}

                {!isLoading && !error && products.length === 0 && (
                    <p>Товары в этой категории не найдены</p>
                )}

                {!isLoading && !error && products.length > 0 && visibleProducts.length === 0 && (
                    <p>По запросу «{searchQuery}» ничего не найдено</p>
                )}

                {!isLoading && !error && visibleProducts.map((product) => (
                    <ProductsCard
                        key={product.id}
                        id={String(product.id)}
                        title={product.name}
                        image={product.image}
                        weight={0}
                        price={Math.floor(product.sellingPrice || 0)}
                    />
                ))}
            </ProductsContent>
        </>
    );
}