export interface ProductPrice {
    value: number;
    currency: string;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    price?: ProductPrice;
    stock?: number;
    images?: Array<{
        meta: {
            downloadHref: string;
        };
    }>;
}

export interface ApiResponse {
    rows: Product[];
    meta: {
        limit: number;
        offset: number;
        size: number;
    };
}