import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface Category {
    id: string;
    name: string;
    image: string;
    productsCount: number;
}

export default function Navbar() {
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const location = useLocation();
    const isHomePage = location.pathname === "/";
    const isMobileView = window.innerWidth <= 1024;

    function toggleMenu(category: string) {
        setOpenCategory(prev => prev === category ? null : category);
    }

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
            <div className="navbar__category">
                <button
                    className={`navbar__button ${openCategory === "categories" ? "active" : ""}`}
                    aria-expanded={openCategory === "categories"}
                    aria-controls="categories-list"
                    onClick={() => toggleMenu("categories")}
                >
                    {openCategory === "categories" ? (
                        <svg className="navbar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M19 9L12 16L5 9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    ) : (
                        <span className="navbar__icon">☰</span>
                    )}

                    <span>Категории</span>
                </button>

                <ul
                    className={`navbar__list ${openCategory === "categories" ? "open" : ""}`}
                    id="categories-list"
                    aria-hidden={openCategory !== "categories"}
                >
                    {isLoading && (
                        <li className="navbar__list__item">
                            <span className="navbar__list__link">Загрузка...</span>
                        </li>
                    )}

                    {error && (
                        <li className="navbar__list__item">
                            <span className="navbar__list__link">{error}</span>
                        </li>
                    )}

                    {!isLoading && !error && categories.map(category => (
                        <li key={category.id} className="navbar__list__item">
                            <Link
                                to={`/category/${encodeURIComponent(category.name)}`}
                                className="navbar__list__link"
                            >
                                {category.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}