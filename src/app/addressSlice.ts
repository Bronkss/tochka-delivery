import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'; // ✅ Явный импорт типа

interface AddressState {
    value: string;
    isValid: boolean;
}

const initialState: AddressState = {
    value: '',
    isValid: false,
};

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        setAddress: (state, action: PayloadAction<string>) => {
            state.value = action.payload;
            const pattern = /^Николаевка\s+[А-Яа-яЁё]+\s+\d+$/;
            state.isValid = pattern.test(action.payload.trim());
        },
        clearAddress: (state) => {
            state.value = '';
            state.isValid = false;
        },
    },
});

export const { setAddress, clearAddress } = addressSlice.actions;
export default addressSlice.reducer;