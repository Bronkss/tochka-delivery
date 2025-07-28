import type {LngLatBounds, SearchResponse} from '@yandex/ymaps3-types';

ymaps3.ready.then(() => {
    ymaps3.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', ['@yandex/ymaps3-default-ui-theme@0.0']);
});

export const findSearchResultBoundsRange = (searchResult: SearchResponse) => {
    let minLng: number | null = null;
    let maxLng: number | null = null;
    let minLat: number | null = null;
    let maxLat: number | null = null;

    searchResult.forEach((searchResultElement) => {
        const [lng, lat] = searchResultElement.geometry.coordinates;

        if (lng < minLng || minLng === null) {
            minLng = lng;
        }

        if (lng > maxLng || maxLng === null) {
            maxLng = lng;
        }

        if (lat < minLat || minLat === null) {
            minLat = lat;
        }

        if (lat > maxLat || maxLat === null) {
            maxLat = lat;
        }
    });

    return [
        [minLng, maxLat],
        [maxLng, minLat]
    ] as LngLatBounds;
};
