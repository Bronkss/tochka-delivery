import { Link } from 'react-router-dom';

export const Auth = () => {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <h2>Вход в аккаунт</h2>
                <form className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Ваш email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Ваш пароль"
                            required
                        />
                    </div>
                    <button type="submit" className="auth-button">Войти</button>
                </form>
                <div className="auth-links">
                    <Link to="/reset-password">Забыли пароль?</Link>
                    <Link to="/register">Ещё нет аккаунта? Зарегистрироваться</Link>
                </div>
            </div>
        </div>
    );
};

export default Auth;