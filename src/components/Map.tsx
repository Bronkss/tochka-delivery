import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../app/store';
import { clearAddress, setAddress, setButtonCheck } from '../app/addressSlice';

declare global {
    interface Window {
        ymaps?: any;
        __yandexMapsPromise?: Promise<any>;
    }
}

type RoutePoint = {
    lat: number;
    lon: number;
};

type YandexGeocodeResult = {
    address: string;
    lat: number;
    lon: number;
};

export type SelectedYandexDeliveryAddress = {
    address: string;
    lat: number;
    lon: number;
    source: 'search' | 'map-click' | 'marker-drag' | 'geolocation';
};

type AddressMapPickerProps = {
    city?: string;
    routeFrom?: RoutePoint;
    initialZoom?: number;
    onChange?: (value: SelectedYandexDeliveryAddress | null) => void;
};

const DEFAULT_STORE_POINT: RoutePoint = {
    lat: 55.792557,
    lon: 98.178143,
};

const DELIVERY_RADIUS_KM = 10;
const DELIVERY_RADIUS_METERS = DELIVERY_RADIUS_KM * 1000;

function loadYandexMaps(apiKey: string, suggestApiKey?: string) {
    if (window.ymaps) {
        return Promise.resolve(window.ymaps);
    }

    if (window.__yandexMapsPromise) {
        return window.__yandexMapsPromise;
    }

    const params = new URLSearchParams({
        apikey: apiKey,
        lang: 'ru_RU',
        coordorder: 'latlong',
    });

    if (suggestApiKey) {
        params.set('suggest_apikey', suggestApiKey);
    }

    window.__yandexMapsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');

        script.src = `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
        script.async = true;

        script.onload = () => {
            window.ymaps.ready(() => {
                resolve(window.ymaps);
            });
        };

        script.onerror = () => {
            reject(new Error('Не удалось загрузить Яндекс.Карты'));
        };

        document.head.appendChild(script);
    });

    return window.__yandexMapsPromise;
}

async function requestYandexGeocoder(payload: {
    query?: string;
    city?: string;
    lat?: number;
    lon?: number;
    kind?: 'house' | 'street' | 'locality';
}) {
    const response = await fetch('/api/yandex/geocode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('Yandex geocoder request failed');
    }

    return response.json() as Promise<YandexGeocodeResult>;
}

function getYmapsGeoObjectAddress(geoObject: any) {
    if (!geoObject) return '';

    const addressLine =
        typeof geoObject.getAddressLine === 'function'
            ? geoObject.getAddressLine()
            : '';

    const metaData = geoObject.properties?.get?.('metaDataProperty');
    const metaText = metaData?.GeocoderMetaData?.text;

    const text = geoObject.properties?.get?.('text');
    const name = geoObject.properties?.get?.('name');
    const description = geoObject.properties?.get?.('description');

    return [addressLine, metaText, text, name, description]
        .find(item => typeof item === 'string' && item.trim().length > 0)
        ?.trim() ?? '';
}

async function requestYmapsGeocode(ymaps: any, payload: {
    query?: string;
    city?: string;
    lat?: number;
    lon?: number;
    kind?: 'house' | 'street' | 'locality';
}) {
    let target: string | [number, number];

    if (
        Number.isFinite(Number(payload.lat)) &&
        Number.isFinite(Number(payload.lon))
    ) {
        target = [Number(payload.lat), Number(payload.lon)];
    } else {
        const query = payload.query?.trim() ?? '';

        if (!query) {
            throw new Error('Empty query');
        }

        if (
            payload.city &&
            !query.toLowerCase().includes(payload.city.toLowerCase())
        ) {
            target = `${payload.city}, ${query}`;
        } else {
            target = query;
        }
    }

    const result = await ymaps.geocode(target, {
        results: 1,
        kind: payload.kind,
    });

    const geoObject = result.geoObjects.get(0);

    if (!geoObject) {
        throw new Error('Ymaps geocode not found');
    }

    const coords = geoObject.geometry.getCoordinates();

    return {
        address: getYmapsGeoObjectAddress(geoObject),
        lat: coords[0],
        lon: coords[1],
    } satisfies YandexGeocodeResult;
}

function isCoordinateLike(value: string) {
    return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(value.trim());
}

function createFallbackAddress(point: RoutePoint) {
    return `Точка на карте: ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}`;
}

function toRadians(value: number) {
    return value * Math.PI / 180;
}

function getDistanceKm(from: RoutePoint, to: RoutePoint) {
    const earthRadiusKm = 6371;

    const dLat = toRadians(to.lat - from.lat);
    const dLon = toRadians(to.lon - from.lon);

    const lat1 = toRadians(from.lat);
    const lat2 = toRadians(to.lat);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
}

function isPointInsideDeliveryRadius(from: RoutePoint, to: RoutePoint) {
    return getDistanceKm(from, to) <= DELIVERY_RADIUS_KM;
}

export default function AddressMapPicker({
                                             city = 'Тайшет',
                                             routeFrom = DEFAULT_STORE_POINT,
                                             initialZoom = 11,
                                             onChange,
                                         }: AddressMapPickerProps) {
    const dispatch = useDispatch<AppDispatch>();

    const savedAddress = useSelector((state: RootState) => state.address.value);
    const isAddressValid = useSelector((state: RootState) => state.address.isValid);
    const buttonCheck = useSelector((state: RootState) => state.address.buttonCheck);

    const mapApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
    const suggestApiKey = import.meta.env.VITE_YANDEX_SUGGEST_API_KEY as string | undefined;

    const previewMapContainerRef = useRef<HTMLDivElement | null>(null);
    const modalMapContainerRef = useRef<HTMLDivElement | null>(null);

    const inputIdRef = useRef(
        `delivery-address-${Math.random().toString(36).slice(2)}`
    );

    const ymapsRef = useRef<any>(null);

    const previewMapRef = useRef<any>(null);
    const previewStorePlacemarkRef = useRef<any>(null);
    const previewDeliveryRadiusRef = useRef<any>(null);

    const modalMapRef = useRef<any>(null);
    const modalStorePlacemarkRef = useRef<any>(null);
    const modalDeliveryRadiusRef = useRef<any>(null);
    const modalDeliveryPlacemarkRef = useRef<any>(null);

    const suggestViewRef = useRef<any>(null);

    const reverseGeocodeRef = useRef<
        | ((
        point: RoutePoint,
        source: SelectedYandexDeliveryAddress['source']
    ) => Promise<void>)
        | null
    >(null);

    const [addressInput, setAddressInput] = useState('');
    const [selectedAddress, setSelectedAddress] =
        useState<SelectedYandexDeliveryAddress | null>(null);

    const [isApiReady, setIsApiReady] = useState(false);
    const [isPreviewReady, setIsPreviewReady] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState('');

    const hasConfirmedAddress = Boolean(savedAddress && isAddressValid && buttonCheck);

    const selectedPoint = useMemo<RoutePoint | null>(() => {
        if (!selectedAddress) return null;

        return {
            lat: selectedAddress.lat,
            lon: selectedAddress.lon,
        };
    }, [selectedAddress]);

    const displayAddress = selectedAddress?.address || savedAddress;

    const createStorePlacemark = useCallback(
        (map: any) => {
            const ymaps = ymapsRef.current;

            if (!ymaps || !map) return null;

            const placemark = new ymaps.Placemark(
                [routeFrom.lat, routeFrom.lon],
                {
                    balloonContent: 'Точка отправления',
                    hintContent: 'Склад',
                },
                {
                    preset: 'islands#blackStretchyIcon',
                    iconContent: 'Склад',
                }
            );

            map.geoObjects.add(placemark);

            return placemark;
        },
        [routeFrom.lat, routeFrom.lon]
    );

    const createDeliveryRadiusCircle = useCallback(
        (map: any) => {
            const ymaps = ymapsRef.current;

            if (!ymaps || !map) return null;

            const circle = new ymaps.Circle(
                [
                    [routeFrom.lat, routeFrom.lon],
                    DELIVERY_RADIUS_METERS,
                ],
                {
                    hintContent: `Зона доставки ${DELIVERY_RADIUS_KM} км`,
                    balloonContent: `Доставляем в радиусе ${DELIVERY_RADIUS_KM} км от склада`,
                },
                {
                    fillColor: '#2BA64522',
                    strokeColor: '#2BA645',
                    strokeOpacity: 0.75,
                    strokeWidth: 2,
                }
            );

            map.geoObjects.add(circle);

            return circle;
        },
        [routeFrom.lat, routeFrom.lon]
    );

    const updateModalDeliveryPlacemark = useCallback(
        (
            point: RoutePoint,
            address: string,
            isOutsideDelivery = false
        ) => {
            const ymaps = ymapsRef.current;
            const map = modalMapRef.current;

            if (!ymaps || !map) return;

            const coords = [point.lat, point.lon];

            if (!modalDeliveryPlacemarkRef.current) {
                modalDeliveryPlacemarkRef.current = new ymaps.Placemark(
                    coords,
                    {
                        balloonContent: address,
                        hintContent: isOutsideDelivery
                            ? 'Адрес вне зоны доставки'
                            : 'Адрес доставки',
                    },
                    {
                        draggable: true,
                        preset: isOutsideDelivery
                            ? 'islands#redDotIcon'
                            : 'islands#greenDotIcon',
                    }
                );

                modalDeliveryPlacemarkRef.current.events.add('dragend', async () => {
                    const markerCoords =
                        modalDeliveryPlacemarkRef.current.geometry.getCoordinates();

                    await reverseGeocodeRef.current?.(
                        {
                            lat: markerCoords[0],
                            lon: markerCoords[1],
                        },
                        'marker-drag'
                    );
                });

                map.geoObjects.add(modalDeliveryPlacemarkRef.current);
            } else {
                modalDeliveryPlacemarkRef.current.geometry.setCoordinates(coords);
                modalDeliveryPlacemarkRef.current.properties.set({
                    balloonContent: address,
                    hintContent: isOutsideDelivery
                        ? 'Адрес вне зоны доставки'
                        : 'Адрес доставки',
                });

                modalDeliveryPlacemarkRef.current.options.set(
                    'preset',
                    isOutsideDelivery
                        ? 'islands#redDotIcon'
                        : 'islands#greenDotIcon'
                );
            }

            map.setCenter(coords, 16, {
                duration: 250,
            });
        },
        []
    );

    const selectAddress = useCallback(
        (
            point: RoutePoint,
            address: string,
            source: SelectedYandexDeliveryAddress['source']
        ) => {
            const cleanAddress =
                address && !isCoordinateLike(address)
                    ? address.trim()
                    : createFallbackAddress(point);

            const distanceKm = getDistanceKm(routeFrom, point);

            if (!isPointInsideDeliveryRadius(routeFrom, point)) {
                setSelectedAddress(null);
                setAddressInput(cleanAddress);

                dispatch(clearAddress());
                dispatch(setButtonCheck(false));

                setError(
                    `Адрес вне зоны доставки. Доставляем только в радиусе ${DELIVERY_RADIUS_KM} км от склада. Выбранная точка примерно ${distanceKm.toFixed(1)} км.`
                );

                updateModalDeliveryPlacemark(
                    point,
                    `${cleanAddress}. Вне зоны доставки`,
                    true
                );

                onChange?.(null);

                return;
            }

            const value: SelectedYandexDeliveryAddress = {
                address: cleanAddress,
                lat: point.lat,
                lon: point.lon,
                source,
            };

            setSelectedAddress(value);
            setAddressInput(cleanAddress);
            setError('');

            dispatch(setAddress(cleanAddress));
            dispatch(setButtonCheck(true));

            updateModalDeliveryPlacemark(point, cleanAddress, false);
            onChange?.(value);
        },
        [
            dispatch,
            onChange,
            routeFrom.lat,
            routeFrom.lon,
            updateModalDeliveryPlacemark,
        ]
    );

    const reverseGeocodeAndSelect = useCallback(
        async (
            point: RoutePoint,
            source: SelectedYandexDeliveryAddress['source']
        ) => {
            const ymaps = ymapsRef.current;

            try {
                setIsSearching(true);
                setError('');

                let result: YandexGeocodeResult | null = null;

                try {
                    result = await requestYandexGeocoder({
                        lat: point.lat,
                        lon: point.lon,
                        kind: 'house',
                    });
                } catch {
                    try {
                        result = await requestYandexGeocoder({
                            lat: point.lat,
                            lon: point.lon,
                        });
                    } catch {
                        if (ymaps) {
                            result = await requestYmapsGeocode(ymaps, {
                                lat: point.lat,
                                lon: point.lon,
                                kind: 'house',
                            });
                        }
                    }
                }

                if (!result) {
                    throw new Error('No geocode result');
                }

                const address = result.address || createFallbackAddress(point);

                selectAddress(
                    {
                        lat: result.lat,
                        lon: result.lon,
                    },
                    address,
                    source
                );
            } catch {
                const fallbackAddress = createFallbackAddress(point);

                selectAddress(point, fallbackAddress, source);

                setError(
                    'Геокодер не вернул адрес. Проверь API Геокодера и ограничения ключа по домену.'
                );
            } finally {
                setIsSearching(false);
            }
        },
        [selectAddress]
    );

    useEffect(() => {
        reverseGeocodeRef.current = reverseGeocodeAndSelect;
    }, [reverseGeocodeAndSelect]);

    const searchAddress = useCallback(
        async (rawQuery: string) => {
            const ymaps = ymapsRef.current;
            const query = rawQuery.trim();

            if (query.length < 3) {
                setError('Введите адрес хотя бы из 3 символов.');
                return;
            }

            try {
                setIsSearching(true);
                setError('');

                let result: YandexGeocodeResult | null = null;

                try {
                    result = await requestYandexGeocoder({
                        query,
                        city,
                    });
                } catch {
                    if (ymaps) {
                        result = await requestYmapsGeocode(ymaps, {
                            query,
                            city,
                        });
                    }
                }

                if (!result) {
                    throw new Error('Address not found');
                }

                selectAddress(
                    {
                        lat: result.lat,
                        lon: result.lon,
                    },
                    result.address || query,
                    'search'
                );
            } catch {
                setError(
                    'Адрес не найден. Уточни улицу и дом или проверь ключ API Геокодера.'
                );
            } finally {
                setIsSearching(false);
            }
        },
        [city, selectAddress]
    );

    useEffect(() => {
        if (!mapApiKey) {
            setError('Не указан VITE_YANDEX_MAPS_API_KEY.');
            return;
        }

        let destroyed = false;

        loadYandexMaps(mapApiKey, suggestApiKey)
            .then((ymaps) => {
                if (destroyed) return;

                ymapsRef.current = ymaps;
                setIsApiReady(true);
            })
            .catch(() => {
                setError('Не удалось загрузить Яндекс.Карты.');
            });

        return () => {
            destroyed = true;
        };
    }, [mapApiKey, suggestApiKey]);

    useEffect(() => {
        if (
            !isApiReady ||
            hasConfirmedAddress ||
            !previewMapContainerRef.current ||
            previewMapRef.current
        ) {
            return;
        }

        const ymaps = ymapsRef.current;

        const previewMap = new ymaps.Map(previewMapContainerRef.current, {
            center: [routeFrom.lat, routeFrom.lon],
            zoom: initialZoom,
            controls: [],
        });

        previewMap.behaviors.disable([
            'drag',
            'scrollZoom',
            'dblClickZoom',
            'multiTouch',
            'rightMouseButtonMagnifier',
        ]);

        previewMapRef.current = previewMap;
        previewDeliveryRadiusRef.current = createDeliveryRadiusCircle(previewMap);
        previewStorePlacemarkRef.current = createStorePlacemark(previewMap);

        setIsPreviewReady(true);

        return () => {
            previewMap.destroy();

            previewMapRef.current = null;
            previewStorePlacemarkRef.current = null;
            previewDeliveryRadiusRef.current = null;
            setIsPreviewReady(false);
        };
    }, [
        createDeliveryRadiusCircle,
        createStorePlacemark,
        hasConfirmedAddress,
        initialZoom,
        isApiReady,
        routeFrom.lat,
        routeFrom.lon,
    ]);

    useEffect(() => {
        if (!isModalOpen || !isApiReady || !modalMapContainerRef.current) {
            return;
        }

        const ymaps = ymapsRef.current;

        const center = selectedPoint
            ? [selectedPoint.lat, selectedPoint.lon]
            : [routeFrom.lat, routeFrom.lon];

        const modalMap = new ymaps.Map(modalMapContainerRef.current, {
            center,
            zoom: selectedPoint ? 16 : initialZoom,
            controls: ['zoomControl', 'geolocationControl'],
        });

        modalMapRef.current = modalMap;
        modalDeliveryRadiusRef.current = createDeliveryRadiusCircle(modalMap);
        modalStorePlacemarkRef.current = createStorePlacemark(modalMap);

        modalMap.events.add('click', async (event: any) => {
            const coords = event.get('coords');

            await reverseGeocodeAndSelect(
                {
                    lat: coords[0],
                    lon: coords[1],
                },
                'map-click'
            );
        });

        if (selectedAddress) {
            updateModalDeliveryPlacemark(
                {
                    lat: selectedAddress.lat,
                    lon: selectedAddress.lon,
                },
                selectedAddress.address
            );
        }

        window.setTimeout(() => {
            modalMap.container.fitToViewport();
        }, 100);

        return () => {
            modalMap.destroy();

            modalMapRef.current = null;
            modalStorePlacemarkRef.current = null;
            modalDeliveryRadiusRef.current = null;
            modalDeliveryPlacemarkRef.current = null;
        };
    }, [
        createDeliveryRadiusCircle,
        createStorePlacemark,
        initialZoom,
        isApiReady,
        isModalOpen,
        reverseGeocodeAndSelect,
        routeFrom.lat,
        routeFrom.lon,
        updateModalDeliveryPlacemark,
    ]);

    useEffect(() => {
        if (!isModalOpen || !isApiReady || !suggestApiKey) return;

        const ymaps = ymapsRef.current;

        const timer = window.setTimeout(() => {
            if (suggestViewRef.current) {
                suggestViewRef.current.destroy?.();
            }

            suggestViewRef.current = new ymaps.SuggestView(inputIdRef.current, {
                results: 7,
            });

            suggestViewRef.current.events.add('select', async (event: any) => {
                const item = event.get('item');
                const value = item?.value;

                if (value) {
                    setAddressInput(value);
                    await searchAddress(value);
                }
            });
        }, 0);

        return () => {
            window.clearTimeout(timer);

            if (suggestViewRef.current) {
                suggestViewRef.current.destroy?.();
                suggestViewRef.current = null;
            }
        };
    }, [isApiReady, isModalOpen, searchAddress, suggestApiKey]);

    useEffect(() => {
        if (isModalOpen) {
            document.body.classList.add('yandex-delivery-modal-lock');
        } else {
            document.body.classList.remove('yandex-delivery-modal-lock');
        }

        return () => {
            document.body.classList.remove('yandex-delivery-modal-lock');
        };
    }, [isModalOpen]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleSearchSubmit = async (event: FormEvent) => {
        event.preventDefault();
        await searchAddress(addressInput);
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setError('Браузер не поддерживает геолокацию.');
            return;
        }

        setIsLocating(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                await reverseGeocodeAndSelect(
                    {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    },
                    'geolocation'
                );

                setIsLocating(false);
            },
            () => {
                setIsLocating(false);
                setError('Не удалось получить местоположение.');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
            }
        );
    };

    const modal = (
        <div className="yandex-delivery-modal" role="dialog" aria-modal="true">
            <div className="yandex-delivery-modal__panel">
                <div className="yandex-delivery-modal__map-side">
                    <div
                        ref={modalMapContainerRef}
                        className="yandex-delivery-modal__map"
                    />
                </div>

                <form
                    className="yandex-delivery-modal__sidebar"
                    onSubmit={handleSearchSubmit}
                >
                    <div className="yandex-delivery-modal__title-row">
                        <div>
                            <label
                                htmlFor={inputIdRef.current}
                                className="yandex-delivery-modal__title"
                            >
                                Адрес доставки
                            </label>

                            <div className="yandex-delivery-modal__hint">
                                Введите адрес, кликните по карте или перетащите маркер. Доставляем в радиусе 10 км от склада.
                            </div>
                        </div>

                        <button
                            type="button"
                            className="yandex-delivery-modal__close"
                            onClick={() => setIsModalOpen(false)}
                            aria-label="Закрыть карту"
                        >
                            ×
                        </button>
                    </div>

                    <div className="yandex-delivery-modal__search">
                        <input
                            id={inputIdRef.current}
                            className="yandex-delivery-modal__input"
                            value={addressInput}
                            onChange={(event) => setAddressInput(event.target.value)}
                            placeholder={
                                city ? `Улица и дом, ${city}` : 'Город, улица, дом'
                            }
                            autoComplete="off"
                        />

                        <button
                            type="submit"
                            className="yandex-delivery-modal__search-button"
                            disabled={isSearching}
                        >
                            {isSearching ? 'Ищем...' : 'Найти'}
                        </button>
                    </div>

                    <button
                        type="button"
                        className="yandex-delivery-modal__location-button"
                        onClick={handleUseMyLocation}
                        disabled={isLocating}
                    >
                        {isLocating ? 'Определяем...' : 'Моё местоположение'}
                    </button>

                    {displayAddress && (
                        <div className="yandex-delivery-modal__selected">
                            <div className="yandex-delivery-modal__selected-title">
                                Выбранный адрес
                            </div>

                            <div className="yandex-delivery-modal__selected-text">
                                {displayAddress}
                            </div>

                            {selectedAddress && (
                                <div className="yandex-delivery-modal__selected-coords">
                                    {selectedAddress.lat.toFixed(6)},{' '}
                                    {selectedAddress.lon.toFixed(6)}
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="yandex-delivery-modal__error">
                            {error}
                        </div>
                    )}

                    <div className="yandex-delivery-modal__footer">
                        <button
                            type="button"
                            className="yandex-delivery-modal__done"
                            onClick={() => setIsModalOpen(false)}
                            disabled={!displayAddress}
                        >
                            Сохранить адрес
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <>
            <aside
                className={
                    hasConfirmedAddress
                        ? 'yandex-delivery-widget yandex-delivery-widget--confirmed'
                        : 'yandex-delivery-widget'
                }
            >
                {hasConfirmedAddress ? (
                    <div className="yandex-delivery-widget__confirmed">
                        <div className="yandex-delivery-widget__confirmed-label">
                            Адрес доставки
                        </div>

                        <div className="yandex-delivery-widget__confirmed-address">
                            {savedAddress}
                        </div>

                        <button
                            type="button"
                            className="yandex-delivery-widget__change-button"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Изменить адрес
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="yandex-delivery-widget__map-button"
                        onClick={() => setIsModalOpen(true)}
                        disabled={!isPreviewReady}
                    >
                        <div
                            ref={previewMapContainerRef}
                            className="yandex-delivery-widget__map"
                        />

                        <div className="yandex-delivery-widget__overlay">
                            <div className="yandex-delivery-widget__badge">
                                Выбрать адрес
                            </div>

                            <div className="yandex-delivery-widget__empty">
                                Нажмите на карту, чтобы выбрать точку доставки
                            </div>
                        </div>

                        {!isPreviewReady && (
                            <div className="yandex-delivery-widget__loading">
                                Загружаем карту...
                            </div>
                        )}
                    </button>
                )}

                {error && !isModalOpen && (
                    <div className="yandex-delivery-widget__error">
                        {error}
                    </div>
                )}
            </aside>

            {isModalOpen ? createPortal(modal, document.body) : null}
        </>
    );
}