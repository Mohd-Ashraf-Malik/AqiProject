import asyncHandler from "../utils/async-handler.js";
import AppError from "../utils/app-error.js";
import { sendSuccess } from "../utils/api-response.js";
import Municipality from "../models/municipality.model.js";
import {
  fetchCityComparison,
  fetchHeatmapStations,
  resolveNearestStation,
} from "../services/station.service.js";

const parseCoordinates = (query) => {
  const latitude = Number(query.latitude);
  const longitude = Number(query.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new AppError("Valid latitude and longitude are required", 400);
  }

  return { latitude, longitude };
};

const resolveMunicipality = async (station) =>
  Municipality.findOne({
    $or: [
      {
        stationMappings: {
          $elemMatch: {
            stationCode: station.stationCode,
            sourceType: station.sourceType,
          },
        },
      },
      {
        stationMappings: {
          $elemMatch: {
            city: station.city,
            ...(station.state ? { state: station.state } : {}),
          },
        },
      },
      {
        city: station.city,
        ...(station.state ? { state: station.state } : {}),
      },
    ],
  });

export const getNearbyStation = asyncHandler(async (req, res) => {
  const requesterLocation = parseCoordinates(req.query);
  const nearestStation = await resolveNearestStation(requesterLocation);
  const municipality = await resolveMunicipality(nearestStation);

  return sendSuccess(res, 200, "Nearest station fetched successfully", {
    station: {
      stationCode: nearestStation.stationCode,
      name: nearestStation.name,
      city: nearestStation.city,
      state: nearestStation.state,
      sourceType: nearestStation.sourceType,
      currentAqi: nearestStation.currentAqi,
      dominantPollutant: nearestStation.dominantPollutant,
      coordinates: nearestStation.coordinates,
      distanceInKm: nearestStation.distanceInKm,
      forecast: nearestStation.forecast,
      time: nearestStation.time,
      attribution: nearestStation.attribution,
      municipality,
    },
  });
});

export const getHeatmapStations = asyncHandler(async (req, res) => {
  const requesterLocation = parseCoordinates(req.query);
  const radiusKm = Number(req.query.radiusKm || process.env.WAQI_HEATMAP_RADIUS_KM || 12);

  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    throw new AppError("radiusKm must be a positive number", 400);
  }

  const stations = await fetchHeatmapStations(requesterLocation, radiusKm);

  const enrichedStations = await Promise.all(
    stations.slice(0, 24).map(async (station) => ({
      ...station,
      municipality: await resolveMunicipality(station),
    }))
  );

  return sendSuccess(res, 200, "Heatmap stations fetched successfully", {
    stations: enrichedStations,
  });
});

export const getCityComparison = asyncHandler(async (req, res) => {
  const rawCities = `${req.query.cities || "Mumbai,Bengaluru,Pune,Hyderabad,Delhi,Noida"}`
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);

  if (!rawCities.length) {
    throw new AppError("At least one city is required", 400);
  }

  const cities = await fetchCityComparison(rawCities.slice(0, 10));

  return sendSuccess(res, 200, "City comparison fetched successfully", {
    cities,
  });
});
