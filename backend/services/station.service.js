import AppError from "../utils/app-error.js";
import { calculateDistanceInKm } from "../utils/geo.js";

const parseJsonResponse = async (response, sourceLabel) => {
  if (!response.ok) {
    throw new AppError(`${sourceLabel} station API failed with status ${response.status}`, 502);
  }

  return response.json();
};

const normalizeStation = (station, sourceType) => {
  const latitude = Number(
    station.latitude ?? station.lat ?? station.coordinates?.latitude
  );
  const longitude = Number(
    station.longitude ?? station.lng ?? station.lon ?? station.coordinates?.longitude
  );

  if (!station.stationCode && !station.id) {
    return null;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    stationCode: `${station.stationCode || station.id}`.trim(),
    name: `${station.name || station.stationName || "Unknown Station"}`.trim(),
    city: `${station.city || station.district || "Unknown City"}`.trim(),
    state: `${station.state || ""}`.trim(),
    sourceType,
    currentAqi:
      station.currentAqi === null || station.currentAqi === undefined
        ? null
        : Number(station.currentAqi),
    coordinates: {
      latitude,
      longitude,
    },
  };
};

const fetchStationsFromApi = async (apiUrl, sourceType) => {
  if (!apiUrl) {
    return [];
  }

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      ...(process.env.AQI_API_KEY ? { Authorization: `Bearer ${process.env.AQI_API_KEY}` } : {}),
    },
  });

  const payload = await parseJsonResponse(response, sourceType);
  const stationList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.stations)
      ? payload.stations
      : Array.isArray(payload.data)
        ? payload.data
        : [];

  return stationList
    .map((station) => normalizeStation(station, sourceType))
    .filter(Boolean);
};

export const fetchAllStations = async () => {
  const governmentStations = await fetchStationsFromApi(
    process.env.GOVERNMENT_AQI_API_URL,
    "government"
  );
  const iotStations = await fetchStationsFromApi(process.env.IOT_AQI_API_URL, "iot");

  const stations = [...governmentStations, ...iotStations];

  if (!stations.length) {
    throw new AppError(
      "No stations were returned by the configured government or IoT AQI APIs",
      503
    );
  }

  return stations;
};

export const resolveNearestStation = async (requesterLocation) => {
  const stations = await fetchAllStations();

  return stations
    .map((station) => ({
      station: {
        ...station,
        distanceInKm: Number(
          calculateDistanceInKm(requesterLocation, station.coordinates).toFixed(2)
        ),
      },
    }))
    .sort((a, b) => a.station.distanceInKm - b.station.distanceInKm)[0].station;
};
