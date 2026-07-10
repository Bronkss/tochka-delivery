import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
    id: number;
    email: string;
    name: string | null;
    phone: string | null;
    isVip: boolean;
}

interface AuthState {
    user: AuthUser | null;
    isInitialized: boolean;
}

const initialState: AuthState = {
    user: null,
    isInitialized: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<AuthUser | null>) => {
            state.user = action.payload;
            state.isInitialized = true;
        },

        clearUser: (state) => {
            state.user = null;
            state.isInitialized = true;
        },
    },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;