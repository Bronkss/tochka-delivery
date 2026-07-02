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

function isRegionOrDistrictPart(part: string): boolean {
    const value = part
        .toLowerCase()
        .replace(/ё/g, 'е')
        .trim();

    const hasOblast =
        /(^|[^а-яa-z])область([^а-яa-z]|$)/i.test(value) ||
        /(^|[^а-яa-z])обл\.?([^а-яa-z]|$)/i.test(value);

    const hasDistrict =
        /(^|[^а-яa-z])район([^а-яa-z]|$)/i.test(value) ||
        /(^|[^а-яa-z])р-н\.?([^а-яa-z]|$)/i.test(value);

    return hasOblast || hasDistrict;
}

function makeShortAddress(address: string): string {
    return address
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => !isRegionOrDistrictPart(part))
        .join(', ');
}

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        setAddress: (state, action: PayloadAction<string>) => {
            const value = makeShortAddress(action.payload.trim());

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