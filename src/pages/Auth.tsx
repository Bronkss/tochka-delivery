import {Link} from 'react-router-dom';

export const Auth = () => {
    return (
        // <div className="auth-page">
        //     <div className="auth-container">
        //         <h2>Вход в аккаунт</h2>
        //         <form className="auth-form">
        //             <div className="form-group">
        //                 <label htmlFor="email">Email</label>
        //                 <input
        //                     type="email"
        //                     id="email"
        //                     placeholder="Ваш email"
        //                     required
        //                 />
        //             </div>
        //             <div className="form-group">
        //                 <label htmlFor="password">Пароль</label>
        //                 <input
        //                     type="password"
        //                     id="password"
        //                     placeholder="Ваш пароль"
        //                     required
        //                 />
        //             </div>
        //             <button type="submit" className="auth-button">Войти</button>
        //         </form>
        //         <div className="auth-links">
        //             <Link to="/reset-password">Забыли пароль?</Link>
        //             <Link to="/register">Ещё нет аккаунта? Зарегистрироваться</Link>
        //         </div>
        //     </div>
        // </div>
        <div className="auth-page">
            <div className="auth-notification">
                <svg className="notification-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round"/>
                    <path d="M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round"/>
                </svg>

                <h2 className="notification-title">Авторизация временно недоступна</h2>
                <p className="notification-message">
                    Мы активно работаем над добавлением функции авторизации.<br/>
                    Пожалуйста, проверяйте обновления в ближайшее время.
                </p>

                <div className="notification-timeline">
                    Ожидаемое обновление: скоро
                </div>
                <Link to='/' className="return-button">Вернуться на главную</Link>
            </div>
        </div>
    );
};

export default Auth;