import gotovayaEdaImage from '../assets/navbar-images/gotovaya-eda.png';
import { useState } from "react";
import { Link } from 'react-router-dom';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar__category">
                <button
                    className={`navbar__button ${isOpen ? 'active' : ''}`}
                    aria-expanded={isOpen}
                    aria-controls="list"
                    onClick={toggleMenu}
                >
                    <img className="navbar__image" src={gotovayaEdaImage} alt="Готовая еда" />
                    Готовая еда
                </button>
                <ul
                    className="navbar__list"
                    id="list"
                    aria-hidden={!isOpen}
                >
                    <li className="navbar__list__item">
                        <Link to="/category/hot-dogs" className="navbar__list__link" tabIndex={isOpen ? 0 : -1}>Хот-доги</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;