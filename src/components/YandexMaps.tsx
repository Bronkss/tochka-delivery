import {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapMarker,
    reactify,
    LOCATION
} from '../lib/ymaps3.ts';

export default function YandexMaps() {
    return (
        <div className="maps-container">
            <YMap location={reactify.useDefault(LOCATION)}>
                <YMapDefaultSchemeLayer />
                <YMapDefaultFeaturesLayer />

                {/* Кнопка геолокации*/}


                <YMapMarker coordinates={reactify.useDefault([37.588144, 55.733842])} draggable={true}>
                    <section>
                        <h1>You can drag this header</h1>
                    </section>
                </YMapMarker>
            </YMap>
        </div>
    );
}
