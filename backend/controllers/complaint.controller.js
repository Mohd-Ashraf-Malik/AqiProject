import Complaint from "../models/complaint.model.js";
import OtpVerification from "../models/otp-verification.model.js";
import Municipality from "../models/municipality.model.js";
import asyncHandler from "../utils/async-handler.js";
import AppError from "../utils/app-error.js";
import { sendSuccess } from "../utils/api-response.js";
import { getStartAndEndOfCurrentDay } from "../utils/date.js";
import { COMPLAINT_CHALLENGES } from "../constants/complaint.constants.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";
import { resolveNearestStation } from "../services/station.service.js";

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

export const registerComplaint = asyncHandler(async (req, res) => {
  const verifiedPhoneNumber = req.complaintSession?.phoneNumber;
  const verificationId = req.complaintSession?.verificationId;

  const complainantName = ensureString(req.body.complainantName, "complainantName", {
    maxLength: 120,
  });
  const message = ensureString(req.body.message, "message", {
    maxLength: 1000,
  });
  const addressLabel = `${req.body.addressLabel || ""}`.trim();
  const challenges = parseChallenges(req.body.challenges);
  const location = parseCoordinates(req.body);

  const verification = await OtpVerification.findOne({
    _id: verificationId,
    phoneNumber: verifiedPhoneNumber,
  });

  if (!verification?.verifiedAt) {
    throw new AppError("Verified OTP session not found", 401);
  }

  const { startOfDay, endOfDay } = getStartAndEndOfCurrentDay();
  const existingComplaint = await Complaint.findOne({
    phoneNumber: verifiedPhoneNumber,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  if (existingComplaint) {
    throw new AppError("Only one complaint per day is allowed for each mobile number", 409);
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
    phoneNumber: verifiedPhoneNumber,
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
      otpVerificationId: verification._id,
      verifiedAt: verification.verifiedAt,
    },
  });

  await complaint.populate("municipality");

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
