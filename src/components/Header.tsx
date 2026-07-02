import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import authIcon from "../assets/icons/auth-icon.svg";
import supportIcon from "../assets/icons/support-icon.svg";
import searchIcon from "../assets/icons/search-icon.svg";
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

export default function Header() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const searchFromUrl = searchParams.get("search") ?? "";
    const [searchValue, setSearchValue] = useState(searchFromUrl);
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        setSearchValue(searchFromUrl);
    }, [searchFromUrl]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const value = searchValue.trim();

        if (!value) {
            navigate("/");
            return;
        }

        navigate(`/search?search=${encodeURIComponent(value)}`);
    };

    return (
        <header className="header">
            <Link to="/" className="header__logo__link">
                <img
                    className="header__logo"
                    src="/logo.png"
                    alt="логотип компании"
                />
            </Link>

            <form className="header__input-block" onSubmit={handleSubmit}>
                <img
                    src={searchIcon}
                    alt="Иконка лупы"
                    className="header__input-block__search-icon"
                />

                <input
                    className="header__input-block__search-input"
                    placeholder="Искать в Точке"
                    type="text"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    spellCheck="false"
                    autoCorrect="off"
                    autoComplete="off"
                />
            </form>

            <div className="header__button-block">
                <Link
                    to={user ? '/account' : '/auth'}
                    className="header__button-block__auth"
                >
                    <img src={authIcon} alt="Иконка авторизации"/>
                    {user ? 'Профиль' : 'Войти'}
                </Link>

                <a
                    href="https://t.me/boroda_slim"
                    className="header__button-block__support"
                    target="_blank"
                    rel="noreferrer"
                >
                    <img src={supportIcon} alt="Иконка поддержки"/>
                </a>
            </div>
        </header>
    );
}