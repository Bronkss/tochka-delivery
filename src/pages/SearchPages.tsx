import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Header from "../components/Header.tsx";
import Navbar from "../components/Navbar.tsx";
import LocationBasketSwitcher from "../components/LocationBasketSwitcher.tsx";
import ProductsContent from "../components/ProductsContent.tsx";
import ProductsCard from "../components/ProductsCard.tsx";

import type { Product } from "../types/product.ts";

type SearchProduct = Product & {
    categoryName?: string;
    description?: string;
};

function normalizeSearchText(value: unknown): string {
    return String(value ?? "")
        .toLowerCase()
        .replaceAll("ё", "е")
        .trim();
}

export default function SearchPages() {
    const [searchParams] = useSearchParams();

    const searchQuery = searchParams.get("search") ?? "";

    const [products, setProducts] = useState<SearchProduct[]>([]);
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

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error("Сервер вернул неверный формат товаров");
                }

                setProducts(data);
            } catch (error) {
                console.error("Ошибка загрузки товаров для поиска:", error);
                setError("Ошибка загрузки товаров");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const visibleProducts = useMemo(() => {
        const normalizedQuery = normalizeSearchText(searchQuery);

        if (!normalizedQuery) {
            return [];
        }

        const queryWords = normalizedQuery
            .split(/\s+/)
            .filter(Boolean);

        return products
            .filter((product) => Number(product.stock) > 0)
            .filter((product) => {
                const productSearchText = normalizeSearchText([
                    product.name,
                    product.category,
                    product.categoryName,
                    product.barcode,
                    product.description,
                ].join(" "));

                return queryWords.every((word) =>
                    productSearchText.includes(word)
                );
            });
    }, [products, searchQuery]);

    return (
        <>
            <Header />
            <Navbar />
            <LocationBasketSwitcher />

            <ProductsContent title={searchQuery ? `Поиск: ${searchQuery}` : "Поиск"}>
                {isLoading && <p>Загрузка товаров...</p>}

                {error && <p>{error}</p>}

                {!isLoading && !error && !searchQuery && (
                    <p>Введите название товара в поиске</p>
                )}

                {!isLoading && !error && searchQuery && visibleProducts.length === 0 && (
                    <p>По запросу «{searchQuery}» ничего не найдено</p>
                )}

                {!isLoading && !error && visibleProducts.map((product) => (
                    <ProductsCard
                        key={product.id}
                        id={String(product.id)}
                        title={product.name}
                        image={product.image}
                        weight={product.unit === "weight" ? "кг" : ""}
                        price={Math.floor(product.sellingPrice || 0)}
                        stock={product.stock}
                    />
                ))}
            </ProductsContent>
        </>
    );
}