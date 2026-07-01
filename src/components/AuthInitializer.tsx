import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import type { AppDispatch } from '../app/store';
import { setUser } from '../app/authSlice';

export default function AuthInitializer() {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();

                dispatch(setUser(data.user ?? null));
            } catch (error) {
                console.error('Ошибка проверки авторизации:', error);
                dispatch(setUser(null));
            }
        };

        loadUser();
    }, [dispatch]);

    return null;
}