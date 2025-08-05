import {Link} from "react-router-dom";
import React from "react";
import Footer from "./Footer.tsx";


interface ProductsContentProps {
    title?: string;
    children?: React.ReactNode;
}

export default function ProductsContent({title, children}: ProductsContentProps) {
    return (
        <>
            <section className="products-content" >
                <Link to={"/"} className="products-content__linkToHome">Главная</Link>
                <h2 className="products-content__title">{title}</h2>
                <div className="products-content__cards">
                    {children}
                </div>
            </section>
            <Footer />
        </>
    )
}