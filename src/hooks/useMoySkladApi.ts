import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ApiResponse, Product } from '../types/product.ts';

const token = '08ddd566f68cf1b32f04595f80480cc614324ae5';

const api: AxiosInstance = axios.create({
    baseURL: 'https://api.moysklad.ru/api/remap/1.2/',
    headers: {
        Authorization: `Bearer ${token}`,
        'Accept-Encoding': 'gzip',
    },
});

export const useMoySkladApi = () => {
    const fetchProducts = async (): Promise<Product[]> => {
        try {
            const response = await api.get<ApiResponse>('entity/assortment', {
                params: {
                    filter: 'type=product', // Только товары (не услуги/модификации)
                    expand: 'images', // Получаем полные данные изображений
                    limit: 100,
                },
            });
            return response.data.rows;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Не удалось загрузить товары');
        }
    };

    return { fetchProducts };
};