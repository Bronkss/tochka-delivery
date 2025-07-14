import React from 'react';
import ReactDom from 'react-dom';
import type {YMapLocationRequest} from '@yandex/ymaps3-types';

const [ymaps3React] = await Promise.all([ymaps3.import('@yandex/ymaps3-reactify'), ymaps3.ready]);
export const reactify  = ymaps3React.reactify.bindTo(React, ReactDom);

export const LOCATION: YMapLocationRequest = {
    center: [98.178476, 55.791633],
    zoom: 15
};

export const {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapMarker,
    YMapControls,
} = reactify.module(ymaps3);

