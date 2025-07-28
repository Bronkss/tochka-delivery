import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AddressState {
    value: string;
    isValid: boolean;
    buttonCheck: boolean;
}

const initialState: AddressState = {
    value: '',
    isValid: false,
    buttonCheck: false,
};

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        setAddress: (state, action: PayloadAction<string>) => {
            state.value = action.payload;
            const pattern = /^село Николаевка,.+$/;
            state.isValid = pattern.test(action.payload.trim());
        },
        clearAddress: (state) => {
            state.value = '';
            state.isValid = false;
        },
        setButtonCheck: (state, action: PayloadAction<boolean>) => {
            state.buttonCheck = action.payload; // Устанавливаем конкретное значение
        }
    },
});

export const { setAddress, clearAddress, setButtonCheck } = addressSlice.actions;
export default addressSlice.reducer;