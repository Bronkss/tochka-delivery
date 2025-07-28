import React from 'react';
import ReactDom from 'react-dom';
import type {YMapLocationRequest, Feature} from '@yandex/ymaps3-types';

const [ymaps3React] = await Promise.all([ymaps3.import('@yandex/ymaps3-reactify'), ymaps3.ready]);
export const reactify  = ymaps3React.reactify.bindTo(React, ReactDom);

export const LOCATION: YMapLocationRequest = {
    center: [98.178476, 55.791633],
    zoom: 15
};

export const COMMON_LOCATION_PARAMS: YMapLocationRequest = {easing: 'ease-in-out', duration: 2000, zoom: 15};


export const initialMarkerProps = {
    properties: {
        name: 'Moscow',
        description: 'Russian Federation'
    },
    geometry: {
        type: 'Point',
        coordinates: [37.617698, 55.755864]
    }
} as Feature;

export const {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapMarker,
    YMapControls, YMapControl,
} = reactify.module(ymaps3);
