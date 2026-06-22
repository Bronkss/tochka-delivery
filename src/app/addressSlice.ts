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
            const value = action.payload.trim();

            state.value = value;
            state.isValid = value.length >= 5;
        },

        clearAddress: (state) => {
            state.value = '';
            state.isValid = false;
            state.buttonCheck = false;
        },

        setButtonCheck: (state, action: PayloadAction<boolean>) => {
            state.buttonCheck = action.payload;
        },
    },
});

export const { setAddress, clearAddress, setButtonCheck } = addressSlice.actions;
export default addressSlice.reducer;