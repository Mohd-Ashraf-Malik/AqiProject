import AppError from "../utils/app-error.js";
import { calculateDistanceInKm } from "../utils/geo.js";

const WAQI_BASE_URL = process.env.WAQI_BASE_URL || "https://api.waqi.info";
const DEFAULT_HEATMAP_RADIUS_KM = Number(process.env.WAQI_HEATMAP_RADIUS_KM || 12);

const getWaqiToken = () => {
  const token = process.env.WAQI_API_TOKEN || process.env.AQI_API_KEY;

  if (!token) {
    throw new AppError(
      "WAQI is not configured. Add WAQI_API_TOKEN in backend/.env and restart the server.",
      503
    );
  }

  if (token.startsWith("http://") || token.startsWith("https://")) {
    throw new AppError(
      "WAQI token is invalid. backend/.env currently contains a URL instead of the real API token.",
      503
    );
  }

  return token;
};

const fetchWaqi = async (pathname, label) => {
  const token = getWaqiToken();
  const separator = pathname.includes("?") ? "&" : "?";
  const response = await fetch(`${WAQI_BASE_URL}${pathname}${separator}token=${token}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new AppError(`WAQI ${label} request failed with status ${response.status}`, 502);
  }

  const payload = await response.json();
  if (payload.status !== "ok") {
    throw new AppError(`WAQI ${label} request failed`, 502, payload.data || payload);
  }

  return payload.data;
};

const normalizeFeedStation = (station) => {
  const latitude = Number(station.city?.geo?.[0]);
  const longitude = Number(station.city?.geo?.[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new AppError("WAQI feed response did not contain valid station coordinates", 502);
  }

  return {
    stationCode: `${station.idx}`.trim(),
    name: `${station.city?.name || "Unknown Station"}`.trim(),
    city: `${station.city?.name || "Unknown City"}`.split(",")[0].trim(),
    state: "",
    sourceType: "waqi",
    currentAqi:
      station.aqi === null || station.aqi === undefined || station.aqi === "-"
        ? null
        : Number(station.aqi),
    dominantPollutant: `${station.dominentpol || ""}`.trim() || null,
    coordinates: {
      latitude,
      longitude,
    },
    forecast: station.forecast?.daily || null,
    time: station.time || null,
    attribution: Array.isArray(station.attributions) ? station.attributions : [],
  };
};

const normalizeMapStation = (station) => {
  const latitude = Number(station.lat);
  const longitude = Number(station.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    stationCode: `${station.uid}`.trim(),
    name: `${station.station?.name || "Unknown Station"}`.trim(),
    city: `${station.station?.name || "Unknown City"}`.split(",")[0].trim(),
    state: "",
    sourceType: "waqi",
    currentAqi:
      station.aqi === null || station.aqi === undefined || station.aqi === "-"
        ? null
        : Number(station.aqi),
    coordinates: {
      latitude,
      longitude,
    },
    time: station.station?.time || null,
  };
};

const normalizeCityFeed = (cityName, station) => {
  const latitude = Number(station.city?.geo?.[0]);
  const longitude = Number(station.city?.geo?.[1]);

  return {
    city: cityName,
    stationCode: `${station.idx}`.trim(),
    stationName: `${station.city?.name || cityName}`.trim(),
    currentAqi:
      station.aqi === null || station.aqi === undefined || station.aqi === "-"
        ? null
        : Number(station.aqi),
    dominantPollutant: `${station.dominentpol || ""}`.trim() || null,
    coordinates:
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? {
            latitude,
            longitude,
          }
        : null,
    time: station.time || null,
  };
};

const buildBoundsFromCenter = (location, radiusKm = DEFAULT_HEATMAP_RADIUS_KM) => {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((location.latitude * Math.PI) / 180) || 1);

  return {
    south: Number((location.latitude - latDelta).toFixed(6)),
    west: Number((location.longitude - lonDelta).toFixed(6)),
    north: Number((location.latitude + latDelta).toFixed(6)),
    east: Number((location.longitude + lonDelta).toFixed(6)),
  };
};

export const resolveNearestStation = async (requesterLocation) => {
  const stationData = await fetchWaqi(
    `/feed/geo:${requesterLocation.latitude};${requesterLocation.longitude}/`,
    "nearest-station"
  );

  const station = normalizeFeedStation(stationData);

  return {
    ...station,
    distanceInKm: Number(
      calculateDistanceInKm(requesterLocation, station.coordinates).toFixed(2)
    ),
  };
};

export const fetchHeatmapStations = async (
  requesterLocation,
  radiusKm = DEFAULT_HEATMAP_RADIUS_KM
) => {
  const bounds = buildBoundsFromCenter(requesterLocation, radiusKm);
  const stationData = await fetchWaqi(
    `/map/bounds/?latlng=${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
    "heatmap"
  );

  return stationData
    .map(normalizeMapStation)
    .filter(Boolean)
    .map((station) => ({
      ...station,
      distanceInKm: Number(
        calculateDistanceInKm(requesterLocation, station.coordinates).toFixed(2)
      ),
    }))
    .sort((a, b) => a.distanceInKm - b.distanceInKm);
};

export const fetchCityComparison = async (cities) => {
  const responses = await Promise.all(
    cities.map(async (city) => {
      try {
        const stationData = await fetchWaqi(`/feed/${encodeURIComponent(city)}/`, `city-${city}`);
        return normalizeCityFeed(city, stationData);
      } catch (err) {
        console.error(`[City Comparison] Failed to fetch data for ${city}: ${err.message}`);
        return null;
      }
    })
  );

  return responses
    .filter(Boolean)
    .sort((a, b) => (b.currentAqi || -1) - (a.currentAqi || -1));
};
