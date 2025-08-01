import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse, Product } from '../types/product.ts';

const token = '08ddd566f68cf1b32f04595f80480cc614324ae5';

const api: AxiosInstance = axios.create({
    baseURL: 'https://api.moysklad.ru/api/remap/1.2/',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Encoding': 'gzip'
    }
});

export const useMoySkladApi = () => {
    const fetchProductsByFolder = async (folderId: string): Promise<Product[]> => {
        try {
            const response = await api.get<ApiResponse>('entity/assortment', {
                params: {
                    filter: `productFolder=https://api.moysklad.ru/api/remap/1.2/entity/productfolder/${folderId}`,
                    expand: 'images,productFolder',
                    limit: 100
                }
            });
            return response.data.rows;
        } catch (error) {
            const err = error as AxiosError<{ errors: Array<{ error: string }> }>;
            const errorMessage = err.response?.data?.errors?.[0]?.error
                || err.message
                || 'Неизвестная ошибка';

            console.error('Ошибка API:', {
                message: errorMessage,
                status: err.response?.status,
                url: err.config?.url
            });

            throw new Error(errorMessage);
        }
    };

    return { fetchProductsByFolder };
};