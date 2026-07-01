import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import type { AppDispatch } from '../app/store';
import { setUser } from '../app/authSlice';

import '../styles/pages/Auth.css';

type AuthMode = 'login' | 'register';

interface AuthUser {
    id: number;
    email: string;
    name: string | null;
    phone: string | null;
}

interface AuthResponse {
    success: boolean;
    user?: AuthUser;
    message?: string;
}

async function readAuthResponse(response: Response): Promise<AuthResponse> {
    const text = await response.text();

    if (!text) {
        return {
            success: false,
            message: 'Сервер не вернул ответ. Проверьте работу API.',
        };
    }

    try {
        return JSON.parse(text) as AuthResponse;
    } catch {
        console.error('Сервер вернул не JSON:', text);

        return {
            success: false,
            message: 'Сервер вернул некорректный ответ. Проверьте консоль и Vercel logs.',
        };
    }
}

function getRussianNetworkError(error: unknown): string {
    if (!(error instanceof Error)) {
        return 'Неизвестная ошибка. Попробуйте ещё раз.';
    }

    if (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Load failed')
    ) {
        return 'Не удалось подключиться к серверу. Проверьте, запущен ли backend.';
    }

    if (
        error.message.includes('Unexpected end of JSON input') ||
        error.message.includes('JSON')
    ) {
        return 'Сервер вернул пустой или повреждённый ответ.';
    }

    return error.message;
}

export const Auth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const redirect = searchParams.get('redirect') || '/';

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isRegister = mode === 'register';

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setIsSubmitting(true);
        setError(null);

        try {
            const endpoint = isRegister
                ? '/api/auth/register'
                : '/api/auth/login';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    name: name.trim(),
                    phone: phone.trim(),
                }),
            });

            const data = await readAuthResponse(response);

            if (!response.ok || !data.success || !data.user) {
                throw new Error(
                    data.message ||
                    (isRegister
                        ? 'Не удалось зарегистрироваться'
                        : 'Не удалось войти в аккаунт')
                );
            }

            dispatch(setUser(data.user));
            navigate(redirect);
        } catch (error) {
            setError(getRussianNetworkError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <h2>
                    {isRegister ? 'Регистрация' : 'Вход в аккаунт'}
                </h2>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {isRegister && (
                        <>
                            <div className="form-group">
                                <label htmlFor="name">Имя</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Ваше имя"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Телефон</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(event) => setPhone(event.target.value)}
                                    placeholder="+7 999 123-45-67"
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Ваш email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Пароль</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Минимум 6 символов"
                            required
                        />
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? 'Подождите...'
                            : isRegister
                                ? 'Зарегистрироваться'
                                : 'Войти'}
                    </button>
                </form>

                <div className="auth-links">
                    {isRegister ? (
                        <button
                            type="button"
                            onClick={() => {
                                setMode('login');
                                setError(null);
                            }}
                        >
                            Уже есть аккаунт? Войти
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setMode('register');
                                setError(null);
                            }}
                        >
                            Ещё нет аккаунта? Зарегистрироваться
                        </button>
                    )}

                    <Link to="/">
                        Вернуться на главную
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Auth;