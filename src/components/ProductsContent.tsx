import { Link } from "react-router-dom";
import React from "react";
import Footer from "./Footer.tsx";

interface ProductsContentProps {
    title?: string;
    children?: React.ReactNode;
}

export default function ProductsContent({ title, children }: ProductsContentProps) {
    return (
        <>
            <section className="products-content">
                <Link to="/" className="products-content__back-button">
                    <svg
                        className="products-content__back-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M15.5 19L8.5 12L15.5 5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    <span>Главная</span>
                </Link>

                <h2 className="products-content__title">{title}</h2>

                <div className="products-content__cards">
                    {children}
                </div>

                <Footer />
            </section>
        </>
    );
}