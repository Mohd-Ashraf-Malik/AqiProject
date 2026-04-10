import Complaint from "../models/complaint.model.js";
import Municipality from "../models/municipality.model.js";
import asyncHandler from "../utils/async-handler.js";
import AppError from "../utils/app-error.js";
import { sendSuccess } from "../utils/api-response.js";
import { getStartAndEndOfCurrentDay } from "../utils/date.js";
import { COMPLAINT_CHALLENGES } from "../constants/complaint.constants.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";
import { resolveNearestStation } from "../services/station.service.js";
import { mailer } from "../utils/mailer.js";

const ensureString = (value, fieldName, { maxLength } = {}) => {
  const parsed = `${value || ""}`.trim();

  if (!parsed) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  if (maxLength && parsed.length > maxLength) {
    throw new AppError(`${fieldName} should be at most ${maxLength} characters`, 400);
  }

  return parsed;
};

const parseCoordinates = (body) => {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new AppError("latitude and longitude are required", 400);
  }

  return { latitude, longitude };
};

const parseChallenges = (rawChallenges) => {
  const challengeList = Array.isArray(rawChallenges)
    ? rawChallenges
    : `${rawChallenges || ""}`
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (!challengeList.length) {
    throw new AppError("At least one challenge must be selected", 400);
  }

  const invalidChallenges = challengeList.filter(
    (item) => !COMPLAINT_CHALLENGES.includes(item)
  );

  if (invalidChallenges.length) {
    throw new AppError("Invalid pollution challenges selected", 400, {
      invalidChallenges,
      allowedChallenges: COMPLAINT_CHALLENGES,
    });
  }

  return [...new Set(challengeList)];
};

const resolveMunicipalityForStation = async (station) => {
  const municipality = await Municipality.findOne({
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

  if (!municipality) {
    throw new AppError(
      `No municipality mapping found for station ${station.stationCode} (${station.city})`,
      404
    );
  }

  return municipality;
};

export const getComplaintMeta = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Complaint metadata fetched successfully", {
    challenges: COMPLAINT_CHALLENGES,
  });
});

/**
 * GET /complaints/stats
 * Query params:
 *   cities  – comma-separated list of city names to filter (optional)
 *   limit   – max cities to return (default 10)
 *
 * Returns complaint counts grouped by city with status breakdown
 * and the top 3 reported challenges per city.
 */
export const getComplaintStats = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const cityFilter = req.query.cities
    ? {
        "assignedStation.city": {
          $in: req.query.cities
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        },
      }
    : {};

  const rows = await Complaint.aggregate([
    { $match: cityFilter },
    { $unwind: "$challenges" },
    {
      $group: {
        _id: {
          city: "$assignedStation.city",
          state: "$assignedStation.state",
          challenge: "$challenges",
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: {
          city: "$_id.city",
          state: "$_id.state",
        },
        total: { $sum: "$count" },
        statusBreakdown: {
          $push: {
            status: "$_id.status",
            count: "$count",
          },
        },
        challengeBreakdown: {
          $push: {
            challenge: "$_id.challenge",
            count: "$count",
          },
        },
      },
    },
    { $sort: { total: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        city: "$_id.city",
        state: "$_id.state",
        total: 1,
        statusBreakdown: 1,
        topChallenges: {
          $slice: [
            {
              $sortArray: {
                input: "$challengeBreakdown",
                sortBy: { count: -1 },
              },
            },
            3,
          ],
        },
      },
    },
  ]);

  return sendSuccess(res, 200, "Complaint statistics fetched successfully", {
    stats: rows,
  });
});

export const registerComplaint = asyncHandler(async (req, res) => {
  const verifiedEmail = `${req.complaintSession?.email || ""}`.trim().toLowerCase();
  const googleSub = `${req.complaintSession?.googleSub || ""}`.trim();

  const complainantName = ensureString(req.body.complainantName, "complainantName", {
    maxLength: 120,
  });
  const contactNumber = `${req.body.contactNumber || ""}`.trim();
  const message = ensureString(req.body.message, "message", {
    maxLength: 1000,
  });
  const addressLabel = `${req.body.addressLabel || ""}`.trim();
  const challenges = parseChallenges(req.body.challenges);
  const location = parseCoordinates(req.body);

  if (!verifiedEmail || !googleSub) {
    throw new AppError("Verified Google session not found", 401);
  }

  const { startOfDay, endOfDay } = getStartAndEndOfCurrentDay();
  const existingComplaint = await Complaint.findOne({
    email: verifiedEmail,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  if (existingComplaint) {
    throw new AppError("Only one complaint per day is allowed for each verified email", 409);
  }

  const nearestStation = await resolveNearestStation(location);
  const municipality = await resolveMunicipalityForStation(nearestStation);

  if (!req.file?.buffer) {
    throw new AppError("Complaint image is required", 400);
  }

  let uploadedImage = null;
  uploadedImage = await uploadBufferToCloudinary(
    req.file.buffer,
    "aqi-complaints",
    req.file.mimetype
  );

  const complaint = await Complaint.create({
    complainantName,
    email: verifiedEmail,
    ...(contactNumber ? { contactNumber } : {}),
    message,
    challenges,
    image: {
      secureUrl: uploadedImage.secureUrl,
      publicId: uploadedImage.publicId,
    },
    location: {
      ...location,
      ...(addressLabel ? { addressLabel } : {}),
    },
    assignedStation: {
      stationCode: nearestStation.stationCode,
      name: nearestStation.name,
      city: nearestStation.city,
      state: nearestStation.state,
      sourceType: nearestStation.sourceType,
      currentAqi: nearestStation.currentAqi,
      distanceInKm: nearestStation.distanceInKm,
      coordinates: nearestStation.coordinates,
    },
    municipality: municipality._id,
    verification: {
      provider: "google",
      googleSub,
      verifiedAt: new Date(),
    },
  });

  await complaint.populate("municipality");

  // Send an email to the responsible municipality
  const targetEmail = municipality.contactEmail || "admin@aqisentry.local";
  const emailText = `A new pollution complaint has been registered.
  
Complainant: ${complainantName} (${verifiedEmail})
Location: ${complaint.location.addressLabel || "Lat: " + complaint.location.latitude + ", Lng: " + complaint.location.longitude}
Station: ${nearestStation.name}
Challenges: ${challenges.join(", ")}
Message: ${message}

Image Reference: ${uploadedImage.secureUrl}

Please review this complaint within the municipality dashboard.`;

  await mailer({
    to: targetEmail,
    subject: `[AQI SENTRY] Action Required: New Complaint for ${municipality.name}`,
    text: emailText,
  });

  return sendSuccess(res, 201, "Complaint registered and routed to nearby municipality", {
    complaint,
    routing: {
      stationName: nearestStation.name,
      stationCode: nearestStation.stationCode,
      municipality: municipality.name,
      distanceInKm: nearestStation.distanceInKm,
    },
  });
});
