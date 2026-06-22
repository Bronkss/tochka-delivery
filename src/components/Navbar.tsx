import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface Category {
    id: string;
    name: string;
    image: string;
    productsCount: number;
}

export default function Navbar() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const location = useLocation();
    const isHomePage = location.pathname === "/";
    const isMobileView = window.innerWidth <= 1024;

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

                console.log("Категории в Navbar:", data);

                setCategories(data);
            } catch (error) {
                console.error(error);
                setError("Ошибка загрузки категорий");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (isMobileView && !isHomePage) {
        return null;
    }

    return (
        <nav className="navbar">
            <div className="navbar__inner">
                <span className="navbar__title">Категории</span>

                <div className="navbar__links">
                    {isLoading && <span className="navbar__status">Загрузка...</span>}

                    {error && <span className="navbar__status">{error}</span>}

                    {!isLoading && !error && categories.map((category) => (
                        <Link
                            key={category.id}
                            to={`/category/${encodeURIComponent(category.name)}`}
                            className="navbar__link"
                        >
                            {category.name}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}