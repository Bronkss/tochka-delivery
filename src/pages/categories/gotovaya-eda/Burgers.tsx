import Header from "../../../components/Header.tsx";
import Navbar from "../../../components/Navbar.tsx";
import LocationBasketSwitcher from "../../../components/LocationBasketSwitcher.tsx";
import ProductsContent from "../../../components/ProductsContent.tsx";
import ProductsCard from "../../../components/ProductsCard.tsx";
import type { Product } from "../../../types/product.ts";
import { useEffect, useState } from "react";

export default function Burgers() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch('/api/products');

                if (!response.ok) {
                    throw new Error('Не удалось загрузить товары');
                }

                const data: Product[] = await response.json();

                const burgers = data.filter(product => product.category === 'Бургеры');

                setProducts(burgers);
            } catch (error) {
                console.error(error);
                setError('Ошибка загрузки товаров');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <>
            <Header />
            <Navbar />
            <LocationBasketSwitcher />

            <ProductsContent title="Бургеры">
                {isLoading && <p>Загрузка товаров...</p>}

                {error && <p>{error}</p>}

                {!isLoading && !error && products.map(product => (
                    <ProductsCard
                        key={product.id}
                        id={String(product.id)}
                        title={product.name}
                        image={product.image || '/logo.jpg'}
                        weight={0}
                        price={Math.floor(product.sellingPrice || 0)}
                        stock={product.stock || 0}
                    />
                ))}
            </ProductsContent>
        </>
    );
}