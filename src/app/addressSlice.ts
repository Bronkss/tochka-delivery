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

function formatAddressPart(part: string): string {
    return part
        .replace(/^город\s+/i, 'г. ')
        .replace(/^село\s+/i, 'с. ')
        .replace(/^деревня\s+/i, 'д. ')
        .replace(/^пос[её]лок\s+/i, 'п. ')
        .replace(/^рабочий пос[её]лок\s+/i, 'рп. ')
        .replace(/^улица\s+/i, 'ул. ')
        .replace(/^проспект\s+/i, 'пр-т ')
        .replace(/^переулок\s+/i, 'пер. ')
        .replace(/^бульвар\s+/i, 'б-р ')
        .replace(/^площадь\s+/i, 'пл. ')
        .replace(/^проезд\s+/i, 'пр-д ')
        .replace(/^шоссе\s+/i, 'ш. ')
        .replace(/^набережная\s+/i, 'наб. ')
        .replace(/^дом\s+/i, 'д. ')
        .trim();
}

function isTrashAddressPart(part: string): boolean {
    const value = part.toLowerCase();

    return (
        value === 'россия' ||
        value.includes('область') ||
        value.includes('край') ||
        value.includes('республика') ||
        value.includes('район') ||
        value.includes('округ') ||
        value.includes('муниципальное') ||
        value.includes('муниципальный') ||
        value.includes('городской округ') ||
        value.includes('сельское поселение') ||
        value.includes('территория')
    );
}

function isLocalityPart(part: string): boolean {
    const value = part.toLowerCase();

    return (
        value.startsWith('город ') ||
        value.startsWith('г. ') ||
        value.startsWith('село ') ||
        value.startsWith('с. ') ||
        value.startsWith('деревня ') ||
        value.startsWith('д. ') ||
        value.startsWith('поселок ') ||
        value.startsWith('посёлок ') ||
        value.startsWith('п. ') ||
        value.startsWith('рабочий поселок ') ||
        value.startsWith('рабочий посёлок ') ||
        value.startsWith('рп. ')
    );
}

function isStreetPart(part: string): boolean {
    const value = part.toLowerCase();

    return (
        value.startsWith('улица ') ||
        value.startsWith('ул. ') ||
        value.startsWith('проспект ') ||
        value.startsWith('пр-т ') ||
        value.startsWith('переулок ') ||
        value.startsWith('пер. ') ||
        value.startsWith('бульвар ') ||
        value.startsWith('б-р ') ||
        value.startsWith('площадь ') ||
        value.startsWith('пл. ') ||
        value.startsWith('проезд ') ||
        value.startsWith('пр-д ') ||
        value.startsWith('шоссе ') ||
        value.startsWith('ш. ') ||
        value.startsWith('набережная ') ||
        value.startsWith('наб. ') ||
        value.startsWith('тракт ') ||
        value.startsWith('микрорайон ') ||
        value.startsWith('мкр. ')
    );
}

function isHousePart(part: string): boolean {
    const value = part.toLowerCase().trim();

    return (
        /^д\.?\s*\d+/i.test(value) ||
        /^дом\s+\d+/i.test(value) ||
        /^\d+[а-яa-z]?(?:\/\d+)?$/i.test(value)
    );
}

function makeShortAddress(address: string): string {
    const parts = address
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => !isTrashAddressPart(part));

    if (parts.length === 0) {
        return address.trim();
    }

    const locality = parts.find(isLocalityPart);
    const street = parts.find(isStreetPart);

    const house = [...parts]
        .reverse()
        .find(isHousePart);

    const result = [locality, street, house]
        .filter(Boolean)
        .map((part) => formatAddressPart(part as string));

    if (result.length > 0) {
        return [...new Set(result)].join(', ');
    }

    return parts
        .map(formatAddressPart)
        .slice(-3)
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