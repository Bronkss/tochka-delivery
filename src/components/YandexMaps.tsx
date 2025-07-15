import {useState} from "react";
import { useDispatch } from 'react-redux';
import { setAddress } from '../app/addressSlice';

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

const {YMapGeolocationControl} = reactify.module(await ymaps3.import('@yandex/ymaps3-controls@0.0.1'));


export default function YandexMaps() {
    const [showMap, setShowMap] = useState<boolean>(true);
    const [localAddress, setLocalAddress] = useState<string>('');
    const [error, setError] = useState<string>('');
    const dispatch = useDispatch();

    const handleClick = () => {
        const pattern = /^Николаевка\s+[А-Яа-яЁё]+\s+\d+$/;

        if (!pattern.test(localAddress.trim())) {
            setError('Введите адрес в формате: "Николаевка улица номер дома (Например: Николаевка Сушкова 30)"');
            return;
        }

        dispatch(setAddress(localAddress));
        setShowMap(false);
        setError('');
    };

    if (!showMap) return null;

    return (
        <div className="maps-container">
            <div className="address">
                <input
                    placeholder="Введите адрес"
                    value={localAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setLocalAddress(e.target.value);
                        setError('');
                    }}
                    className="address__input"
                />
                <button className="address__button" onClick={handleClick}>Выбрать</button>
                {error && <div style={{ color: 'red' }}>{error}</div>}
            </div>

            <YMap location={reactify.useDefault(LOCATION)}>
                <YMapDefaultSchemeLayer/>
                <YMapDefaultFeaturesLayer/>

                {/* геолокация*/}
                <YMapControls position="right">
                    {/* Add YMapControlButton that will enable or disable fullscreen mode */}
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