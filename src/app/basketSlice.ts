import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Product {
    id: string;
    title: string;
    price: number;
    image?: string;
    weight: string;
}

export interface BasketItem extends Product {
    quantity: number;
}

interface BasketState {
    items: BasketItem[];
    total: number;
}

const initialState: BasketState = {
    items: [],
    total: 0,
};

function calculateTotal(items: BasketItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

const basketSlice = createSlice({
    name: 'basket',
    initialState,
    reducers: {
        addToBasket: (state, action: PayloadAction<Product>) => {
            const existingItem = state.items.find(
                item => item.id === action.payload.id
            );

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({
                    ...action.payload,
                    quantity: 1,
                });
            }

            state.total = calculateTotal(state.items);
        },

        removeFromBasket: (state, action: PayloadAction<string>) => {
            const itemIndex = state.items.findIndex(
                item => item.id === action.payload
            );

            if (itemIndex !== -1) {
                if (state.items[itemIndex].quantity > 1) {
                    state.items[itemIndex].quantity -= 1;
                } else {
                    state.items.splice(itemIndex, 1);
                }
            }

            state.total = calculateTotal(state.items);
        },

        clearBasket: (state) => {
            state.items = [];
            state.total = 0;
        },
    },
});

export const { addToBasket, removeFromBasket, clearBasket } = basketSlice.actions;
export default basketSlice.reducer;