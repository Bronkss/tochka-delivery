import {Link} from 'react-router-dom';
import authIcon from '../assets/icons/auth-icon.svg'
import supportIcon from '../assets/icons/support-icon.svg'
import searchIcon from '../assets/icons/search-icon.svg'

export default function Header() {
    return (
        <>
            <header className="header">
                <Link to="/">
                    <img className="header__logo" src="/rodnik-logo.png" alt="логотип компании"/>
                </Link>

                <div className="header__input-block">
                    <img src={searchIcon} alt="Иконка лупы" className="header__input-block__search-icon" />
                    <input className="header__input-block__search-input"
                           placeholder="Искать в Роднике"
                           type="text"
                           spellCheck="false"
                           autoCorrect="off"
                           autoComplete="off"/>
                </div>

                <div className="header__button-block">
                    <Link to="/auth" className="header__button-block__auth">
                        <img src={authIcon} alt="Иконка авторизации"/>
                        Войти
                    </Link>
                    <a href="https://t.me/RodnikSupport_bot" className="header__button-block__support">
                        <img src={supportIcon} alt="Иконка поддержки"/>
                    </a>
                </div>
            </header>
        </>
    )
}