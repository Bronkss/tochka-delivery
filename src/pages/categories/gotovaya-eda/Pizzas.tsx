import Header from "../../../components/Header.tsx";
import Navbar from "../../../components/Navbar.tsx";
import LocationBasketSwitcher from "../../../components/LocationBasketSwitcher.tsx";
import ProductsContent from "../../../components/ProductsContent.tsx";
import ProductsCard from "../../../components/ProductsCard.tsx";
import { useMoySkladApi } from '../../../hooks/useMoySkladApi.ts';
import type {Product} from "../../../types/product.ts";
import {useEffect, useState} from "react";

export default function Pizzas() {
    const [products, setProducts] = useState<Product[]>([]);
    const { fetchProductsByFolder } = useMoySkladApi();
    const FOLDER_ID = '9e5a4aa8-6c71-11f0-0a80-14d8000f1e09'; // ID группы в МойСклад

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProductsByFolder(FOLDER_ID);
                setProducts(data);
            } catch (error) {
                console.error('Ошибка загрузки товаров:', error);
            }
        };
        loadProducts()
    }, [fetchProductsByFolder]);


    return (
        <>
            <Header />
            <Navbar/>
            <LocationBasketSwitcher/>
            <ProductsContent title="Пиццы" >
                {products.map(product => (
                    <ProductsCard
                        key={product.id}
                        id={product.id}
                        title={product.name}
                        image={product.images?.rows?.[0]?.miniature?.href || ''}
                        weight={product.weight || 0}
                        price={Math.floor(product.salePrices?.[0]?.value || 0)}
                        salePrices={product.salePrices}
                        stock={product.stock || 0}
                    />
                ))}
            </ProductsContent>
        </>
    )
}
