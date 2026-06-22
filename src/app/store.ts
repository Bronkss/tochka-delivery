import { configureStore } from '@reduxjs/toolkit';

import addressReducer from './addressSlice';
import basketReducer from './basketSlice';

export const store = configureStore({
    reducer: {
        address: addressReducer,
        basket: basketReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;