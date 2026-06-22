type GeocodeRequestBody = {
    query?: string;
    city?: string;
    lat?: number;
    lon?: number;
    kind?: 'house' | 'street' | 'metro' | 'district' | 'locality';
};

function readBody(request: any): GeocodeRequestBody {
    if (!request.body) return {};

    if (typeof request.body === 'string') {
        try {
            return JSON.parse(request.body);
        } catch {
            return {};
        }
    }

    return request.body;
}

function normalizeQuery(query: string, city?: string) {
    const value = query.trim();

    if (!city) return value;

    const lowerValue = value.toLowerCase();
    const lowerCity = city.toLowerCase();

    if (lowerValue.includes(lowerCity)) {
        return value;
    }

    return `${city}, ${value}`;
}

function getGeoObject(data: any) {
    return data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
}

function parseGeoObject(geoObject: any) {
    if (!geoObject) return null;

    const address =
        geoObject?.metaDataProperty?.GeocoderMetaData?.text ||
        geoObject?.description ||
        geoObject?.name ||
        '';

    const pos = geoObject?.Point?.pos;

    if (!pos || typeof pos !== 'string') {
        return null;
    }

    const [lonText, latText] = pos.split(' ');

    const lon = Number(lonText);
    const lat = Number(latText);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
    }

    return {
        address,
        lat,
        lon,
    };
}

export default async function handler(request: any, response: any) {
    if (request.method !== 'POST') {
        return response.status(405).json({
            message: 'Method not allowed',
        });
    }

    const apiKey = process.env.YANDEX_GEOCODER_API_KEY;

    if (!apiKey) {
        return response.status(500).json({
            message: 'YANDEX_GEOCODER_API_KEY is not configured',
        });
    }

    const body = readBody(request);

    const hasCoords =
        Number.isFinite(Number(body.lat)) && Number.isFinite(Number(body.lon));

    const hasQuery =
        typeof body.query === 'string' && body.query.trim().length >= 3;

    if (!hasCoords && !hasQuery) {
        return response.status(400).json({
            message: 'query or lat/lon is required',
        });
    }

    const params = new URLSearchParams({
        apikey: apiKey,
        format: 'json',
        lang: 'ru_RU',
        results: '1',
    });

    if (hasCoords) {
        params.set('geocode', `${Number(body.lon)},${Number(body.lat)}`);

        if (body.kind) {
            params.set('kind', body.kind);
        }
    } else {
        params.set('geocode', normalizeQuery(body.query!, body.city));
    }

    try {
        const yandexResponse = await fetch(
            `https://geocode-maps.yandex.ru/1.x/?${params.toString()}`
        );

        const data = await yandexResponse.json();

        if (!yandexResponse.ok) {
            return response.status(yandexResponse.status).json(data);
        }

        const geoObject = getGeoObject(data);
        const parsed = parseGeoObject(geoObject);

        if (!parsed) {
            return response.status(404).json({
                message: 'Address not found',
            });
        }

        return response.status(200).json(parsed);
    } catch {
        return response.status(500).json({
            message: 'Failed to geocode address',
        });
    }
}