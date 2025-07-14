import { Link } from 'react-router-dom';

function Header() {
    return (
        <>
            <header className="header">
                <img className="header__logo" src="/rodnik-logo.png" alt="логотип компании"/>
                <input className="searchInput" placeholder="Искать в Роднике" type="text"
                       spellCheck="false" autoCorrect="off" autoComplete="off"/>
                <Link to="/auth" className="auth">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
                        <path fill="currentColor" fill-rule="evenodd"
                              d="M16.858 13.42c-.45-.18-.955-.04-1.315.283C14.575 14.57 13.36 15.2 12 15.2c-1.36 0-2.575-.63-3.543-1.497-.36-.324-.865-.462-1.315-.282C5.466 14.09 4 14.973 4 16c0 2.4 2.4 5.6 8 5.6s8-3.2 8-5.6c0-1.027-1.466-1.908-3.142-2.58"
                              clip-rule="evenodd"></path>
                        <path fill="currentColor"
                              d="M16.8 7.3c0 3.093-2.4 6.3-4.8 6.3s-4.8-3.207-4.8-6.3S9.349 2.4 12 2.4s4.8 1.807 4.8 4.9"></path>
                    </svg>
                    Войти</Link>
                <a href="https://t.me/RodnikSupport_bot" className="support">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
                        <path fill="#404040" fill-rule="evenodd"
                              d="M1 10.516C1 5.312 6.378 2 11.756 2 17.133 2 23 5.312 23 10.516s-4.4 8.99-11.244 8.99H8.117a1 1 0 0 0-.508.138l-3.89 2.3a.396.396 0 0 1-.595-.4c.149-.968.412-2.597.673-3.81a1.09 1.09 0 0 0-.313-1.008C1.742 15.033 1 13.14 1 10.516m7 1.916c.828 0 1.5-.667 1.5-1.49s-.672-1.49-1.5-1.49-1.5.667-1.5 1.49.672 1.49 1.5 1.49m5.5-1.49c0 .823-.672 1.49-1.5 1.49s-1.5-.667-1.5-1.49.672-1.49 1.5-1.49 1.5.667 1.5 1.49m2.5 1.49c.828 0 1.5-.667 1.5-1.49s-.672-1.49-1.5-1.49-1.5.667-1.5 1.49.672 1.49 1.5 1.49"
                              clip-rule="evenodd"></path>
                    </svg>
                </a>
            </header>
        </>
    )
}

export default Header;