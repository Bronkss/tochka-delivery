import {useState} from "react";
import {Link} from 'react-router-dom';
import gotovayaEdaImage from '../assets/navbar-images/gotovaya-eda.jpg';
import bailey from '../assets/navbar-images/bakaleya.jpg'

export default function Navbar() {
    const [openCategory, setOpenCategory] = useState<string | null>(null);

    function toggleMenu(category: string) {
        setOpenCategory(prev => prev === category ? null : category);
    }

    return (
        <nav className="navbar">
            {/* Блок "Готовая еда" */}
            <div className="navbar__category">
                <button
                    className={`navbar__button ${openCategory === 'gotovaya-eda' ? 'active' : ''}`}
                    aria-expanded={openCategory === 'gotovaya-eda'}
                    aria-controls="gotovaya-eda-list"
                    onClick={() => toggleMenu('gotovaya-eda')}
                >
                    {openCategory === 'gotovaya-eda' ? (
                        <svg className="navbar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                  strokeLinejoin="round"/>
                        </svg>
                    ) : (
                        <img className="navbar__icon" src={gotovayaEdaImage} alt="Готовая еда"/>
                    )}
                    <span>Готовая еда</span>
                </button>
                <ul
                    className={`navbar__list ${openCategory === 'gotovaya-eda' ? 'open' : ''}`}
                    id="gotovaya-eda-list"
                    aria-hidden={openCategory !== 'gotovaya-eda'}
                >
                    <li className="navbar__list__item">
                        <Link to="/category/pizzas" className="navbar__list__link">Пиццы</Link>
                    </li>
                    <li className="navbar__list__item">
                        <Link to="/category/burgers" className="navbar__list__link">Бургеры</Link>
                    </li>
                </ul>
            </div>

            {/* Блок "Бакалея" */}
            <div className="navbar__category">
                <button
                    className={`navbar__button ${openCategory === 'bailey' ? 'active' : ''}`}
                    aria-expanded={openCategory === 'bailey'}
                    aria-controls="bailey-list"
                    onClick={() => toggleMenu('bailey')}
                >
                    {openCategory === 'bailey' ? (
                        <svg className="navbar__icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                  strokeLinejoin="round"/>
                        </svg>
                    ) : (
                        <img className="navbar__icon" src={bailey} alt="Овощи и фрукты"/>
                    )}
                    <span>Бакалея</span>
                </button>
                <ul
                    className={`navbar__list ${openCategory === 'bailey' ? 'open' : ''}`}
                    id="bailey-list"
                    aria-hidden={openCategory !== 'bailey'}
                >
                    <li className="navbar__list__item">
                        <Link to="/category/canned-food" className="navbar__list__link">Консервы</Link>
                    </li>
                    <li className="navbar__list__item">
                        <Link to="/category/tea" className="navbar__list__link">Кофе и какао</Link>
                    </li>
                    <li className="navbar__list__item">
                        <Link to="/category/tea" className="navbar__list__link">Макароны, крупы и мука</Link>
                    </li>
                    <li className="navbar__list__item">
                        <Link to="/category/tea" className="navbar__list__link">
                            Масло, соусы и приправы</Link>
                    </li>
                    <li className="navbar__list__item">
                        <Link to="/category/tea" className="navbar__list__link">Чай и сахар</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}