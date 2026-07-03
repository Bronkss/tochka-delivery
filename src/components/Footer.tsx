import "../styles/components/Footer.css";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="site-footer__top">
                <div>
                    <h2>Точка доставки</h2>
                    <p>
                        Онлайн-сервис доставки продуктов и товаров повседневного спроса.
                    </p>
                </div>

                <div className="site-footer__info">
                    <span>Доставка: с 10:00 до 22:00</span>
                    <span>Минимальный заказ: от 100 ₽</span>
                    <span>Зона доставки: до 10 км от склада</span>
                </div>
            </div>

            <div className="site-footer__bottom">
                <span>
                    © {currentYear} Точка доставки. Все права защищены.
                </span>

                <span>
                    Информация на сайте не является публичной офертой.
                </span>
            </div>
        </footer>
    );
}