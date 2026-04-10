import asyncHandler from "../utils/async-handler.js";
import AppError from "../utils/app-error.js";
import { sendSuccess } from "../utils/api-response.js";
import Municipality from "../models/municipality.model.js";
import { resolveNearestStation } from "../services/station.service.js";

const parseCoordinates = (query) => {
  const latitude = Number(query.latitude);
  const longitude = Number(query.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new AppError("Valid latitude and longitude are required", 400);
  }

  return { latitude, longitude };
};

export const getNearbyStation = asyncHandler(async (req, res) => {
  const requesterLocation = parseCoordinates(req.query);
  const nearestStation = await resolveNearestStation(requesterLocation);
  const municipality = await Municipality.findOne({
    $or: [
      {
        stationMappings: {
          $elemMatch: {
            stationCode: nearestStation.stationCode,
            sourceType: nearestStation.sourceType,
          },
        },
      },
      {
        stationMappings: {
          $elemMatch: {
            city: nearestStation.city,
            ...(nearestStation.state ? { state: nearestStation.state } : {}),
          },
        },
      },
      {
        city: nearestStation.city,
        ...(nearestStation.state ? { state: nearestStation.state } : {}),
      },
    ],
  });

  return sendSuccess(res, 200, "Nearest station fetched successfully", {
    station: {
      stationCode: nearestStation.stationCode,
      name: nearestStation.name,
      city: nearestStation.city,
      state: nearestStation.state,
      sourceType: nearestStation.sourceType,
      currentAqi: nearestStation.currentAqi,
      coordinates: nearestStation.coordinates,
      distanceInKm: nearestStation.distanceInKm,
      municipality,
    },
  });
});
