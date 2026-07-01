import { configureStore } from '@reduxjs/toolkit';

import addressReducer from './addressSlice';
import basketReducer from './basketSlice';
import authReducer from './authSlice';

export const store = configureStore({
    reducer: {
        address: addressReducer,
        basket: basketReducer,
        auth: authReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;