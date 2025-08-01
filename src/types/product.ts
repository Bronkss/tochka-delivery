export interface ProductPrice {
    value: number;
    currency: {
        meta: {
            href: string;
            type: string;
            mediaType: string;
        };
    };
    priceType?: {
        name: string;
    };
}

export interface ImageMeta {
    href: string;
    type: string;
    mediaType: string;
    downloadHref?: string;
}

export interface ImageVariant {
    href: string;
    type: string;
    mediaType: string;
    downloadHref?: string;
}

export interface ProductImage {
    meta: ImageMeta;
    title: string;
    filename: string;
    size: number;
    updated: string;
    miniature: ImageVariant;
    tiny: ImageVariant;
}

export interface ProductImages {
    meta: {
        href: string;
        type: string;
        mediaType: string;
        size: number;
        limit: number;
        offset: number;
    };
    rows: ProductImage[];
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    salePrices: ProductPrice[];
    weight?: number;
    stock?: number;
    images?: ProductImages;
    productFolder?: {
        meta: {
            href: string;
            id: string;
        };
    };
}

export interface ApiResponse {
    rows: Product[];
    meta: {
        limit: number;
        offset: number;
        size: number;
    };
}