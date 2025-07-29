import { useState, useEffect } from 'react';
import { useMoySkladApi } from '../hooks/useMoySkladApi';
import type { Product } from '../types/product';


const ProductList = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { fetchProducts } = useMoySkladApi();

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchProducts();
                setProducts(data);
            } catch (err) {
                setError('Ошибка при загрузке товаров');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [fetchProducts]);

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="product-list">
            <h2>Список товаров</h2>
            {products.length > 0 ? (
                <ul>
                    {products.map((product) => (
                        <li key={product.id} className="product-item">
                            <div className="product-info">
                                <h3>{product.name}</h3>
                                {product.description && <p>{product.description}</p>}
                                <div className="product-details">
                                    {product.price && (
                                        <span>Цена: {product.price.value} {product.price.currency}</span>
                                    )}
                                    {product.stock !== undefined && (
                                        <span>Остаток: {product.stock} шт.</span>
                                    )}
                                </div>
                            </div>
                            {product.images?.[0] && (
                                <img
                                    src={product.images[0].meta.downloadHref}
                                    alt={product.name}
                                    className="product-image"
                                />
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Товары не найдены</p>
            )}
        </div>
    );
};

export default ProductList;