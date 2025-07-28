import {useState} from "react";
import {Link} from 'react-router-dom';
import gotovayaEdaImage from '../assets/navbar-images/gotovaya-eda.jpg';
import vegetables from '../assets/navbar-images/ovoshi-i-fructi.jpg'

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
                        <Link to="/category/hot-dogs" className="navbar__list__link">Хот-доги</Link>
                    </li>
                    <li className="navbar__list__item">
                        <Link to="/category/burgers" className="navbar__list__link">Бургеры</Link>
                    </li>
                </ul>
            </div>

            {/* Блок "Овощи и фрукты" */}
            <div className="navbar__category">
                <button
                    className={`navbar__button ${openCategory === 'vegetables' ? 'active' : ''}`}
                    aria-expanded={openCategory === 'vegetables'}
                    aria-controls="vegetables-list"
                    onClick={() => toggleMenu('vegetables')}
                >
                    {openCategory === 'vegetables' ? (
                        <svg className="navbar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                  strokeLinejoin="round"/>
                        </svg>
                    ) : (
                        <img className="navbar__icon" src={vegetables} alt="Овощи и фрукты"/>
                    )}
                    <span>Овощи и фрукты</span>
                </button>
                <ul
                    className={`navbar__list ${openCategory === 'vegetables' ? 'open' : ''}`}
                    id="vegetables-list"
                    aria-hidden={openCategory !== 'vegetables'}
                >
                    <li className="navbar__list__item">
                        <Link to="/category/coffee" className="navbar__list__link">Овощи, грибы и зелень</Link>
                    </li>
                    <li className="navbar__list__item">
                        <Link to="/category/tea" className="navbar__list__link">Фрукты и ягоды</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}