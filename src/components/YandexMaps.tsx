import {useState, useCallback, useEffect} from "react";
import type {SearchResponse, Feature} from '@yandex/ymaps3-types';
import {useDispatch, useSelector} from 'react-redux';
import {setAddress, setButtonCheck} from '../app/addressSlice';
import type {RootState} from '../app/store';

import {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapMarker,
    reactify,
    LOCATION,
    YMapControls,
    YMapControl,
    COMMON_LOCATION_PARAMS
} from '../lib/ymaps3.ts';

import {initialMarkerProps} from "../lib/ymaps3.ts";
import {findSearchResultBoundsRange} from "../lib/common.ts";

const {YMapGeolocationControl} = reactify.module(await ymaps3.import('@yandex/ymaps3-controls@0.0.1'));

const {YMapDefaultMarker, YMapSearchControl} = reactify.module(
    await ymaps3.import('@yandex/ymaps3-default-ui-theme')
);

export default function YandexMaps() {
    const dispatch = useDispatch();
    const [location, setLocation] = useState(LOCATION);
    const [searchMarkersProps, setSearchMarkersProps] = useState([initialMarkerProps]);

    const updateMapLocation = useCallback((searchResult: SearchResponse) => {
        if (searchResult.length !== 0) {
            let center;
            let zoom;
            let bounds;

            if (searchResult.length === 1) {
                center = searchResult[0].geometry?.coordinates;
                zoom = 12;
            } else {
                bounds = findSearchResultBoundsRange(searchResult);
            }

            setLocation({
                center,
                zoom,
                bounds,
                duration: 400
            });
        }
    }, []);

    const searchResultHandler = useCallback((searchResult: SearchResponse) => {
        setSearchMarkersProps(searchResult);
        updateMapLocation(searchResult);
        dispatch(setAddress(searchResult[0].properties.description.split(',')[0] + ", " + searchResult[0].properties.name));
    }, []);

    const onClickSearchMarkerHandler = useCallback(
        (clickedMarker: Feature) => {
            setSearchMarkersProps(searchMarkersProps.filter((marker) => marker !== clickedMarker));
        },
        [searchMarkersProps]
    );

    const [error, setError] = useState<string | null>(null);

    //
    // // Получаем текущий адрес из хранилища
    const {value: savedAddress, isValid, buttonCheck} = useSelector((state: RootState) => state.address);
    //
    // // Проверяем, нужно ли показывать карту
    const shouldShowMap = !savedAddress;

    //
    function handleClick() {

        const pattern = /^село Николаевка,.+$/;

        if (!pattern.test(savedAddress.trim())) {
            showError('Доставка возможно только в село Николаевка, Иркутской области.');
            return;
        }

        setError('');
        dispatch(setButtonCheck(true))
    }

    function handleClickBack() {
        dispatch(setAddress(''))
    }

    const showError = (message: string) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    // Если адрес уже есть, не показываем карту
    if (!shouldShowMap && isValid && buttonCheck) return null;

    return (
        <div className="maps-container">
            {!savedAddress && (
                <div className="hint">
                    <span>Введите адрес в поле поиска начиная:<br/> Иркутская область Николаевка "ваша улица и номер дома"</span>
                    <span>(Например: Иркутская область Николаевка Ленина 1)</span>
                </div>
            )}

            {savedAddress && (
                <div className="maps-container__info">
                    <div className="maps-container__content">
                        <span>Ваш адрес:</span>
                        <span>{savedAddress}</span>
                        <div className="maps-container__info__button-block">
                            <button onClick={handleClick}>Да, верно</button>
                            <button onClick={handleClickBack}>Нет, другой</button>
                        </div>
                        {error && <div className="error">{error}</div>}
                    </div>
                </div>
            )}

            <YMap location={reactify.useDefault(LOCATION)}>
                <YMapDefaultSchemeLayer/>
                <YMapDefaultFeaturesLayer/>
                <YMapControls position="top">
                    <YMapSearchControl searchResult={searchResultHandler}/>
                </YMapControls>

                {searchMarkersProps.map((marker) => (
                    <YMapDefaultMarker
                        key={+marker.geometry.coordinates}
                        title={marker.properties.name}
                        subtitle={marker.properties.description}
                        coordinates={marker.geometry.coordinates}
                        onClick={() => onClickSearchMarkerHandler(marker)}
                        size="normal"
                        iconName="fallback"
                    />
                ))}

                <YMapControls position="right">
                    <YMapControl>
                        <YMapGeolocationControl {...COMMON_LOCATION_PARAMS} />
                    </YMapControl>
                </YMapControls>

                <YMapMarker coordinates={reactify.useDefault([98.182788, 55.793278])} draggable={true}>
                    <img src="/rodnik-logo.png" alt="" width="100px"/>
                </YMapMarker>
            </YMap>
        </div>
    );
}