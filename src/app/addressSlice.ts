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

const REMOVE_ADDRESS_PARTS = [
    /^(россия|рф)$/i,
    /^\d{6}$/,
    /федеральный округ/i,
    /область/i,
    /\bкрай\b/i,
    /республика/i,
    /район/i,
    /муниципаль/i,
    /городской округ/i,
];

const SETTLEMENT_REGEXP = /\b(город|г\.?|село|с\.?|деревня|д\.?|пос[её]лок|п\.?|пгт|станица|аул)\b/i;
const STREET_REGEXP = /\b(улица|ул\.?|проспект|пр-кт|переулок|пер\.?|проезд|шоссе|бульвар|б-р|площадь|пл\.?|набережная|наб\.?)\b/i;
const HOUSE_REGEXP = /\b(дом|д\.?|здание|зд\.?|строение|стр\.?|корпус|к\.?)\s*[\dа-яa-z/-]+\b|^\d+[а-яa-z]?(?:[/-]\d+[а-яa-z]?)?$/i;

function cleanAddressPart(part: string) {
    return part
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/^город\s+/i, 'г. ')
        .replace(/^село\s+/i, 'с. ')
        .replace(/^деревня\s+/i, 'д. ')
        .replace(/^пос[её]лок\s+/i, 'п. ')
        .replace(/^улица\s+/i, 'ул. ')
        .replace(/^дом\s+/i, 'д. ');
}

function shouldRemoveAddressPart(part: string) {
    return REMOVE_ADDRESS_PARTS.some((regexp) => regexp.test(part));
}

function isSettlement(part: string) {
    return SETTLEMENT_REGEXP.test(part) && !STREET_REGEXP.test(part);
}

function isStreet(part: string) {
    return STREET_REGEXP.test(part);
}

function isHouse(part: string) {
    return HOUSE_REGEXP.test(part);
}

export function formatShortAddress(address: string) {
    const sourceParts = address
        .split(',')
        .map(cleanAddressPart)
        .filter(Boolean);

    const usefulParts = sourceParts.filter((part) => !shouldRemoveAddressPart(part));

    const settlement = usefulParts.find(isSettlement) ?? usefulParts.find((part) => !isStreet(part) && !isHouse(part));
    const street = usefulParts.find(isStreet);
    const house = usefulParts.find(isHouse);

    const result = [settlement, street, house]
        .filter((part): part is string => Boolean(part))
        .filter((part, index, array) => array.indexOf(part) === index);

    if (result.length > 0) {
        return result.join(', ');
    }

    return address.trim();
}

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        setAddress: (state, action: PayloadAction<string>) => {
            const value = formatShortAddress(action.payload);

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
