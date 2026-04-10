import jwt from "jsonwebtoken";
import asyncHandler from "../utils/async-handler.js";
import AppError from "../utils/app-error.js";
import { sendSuccess } from "../utils/api-response.js";
import { VERIFICATION_PURPOSES } from "../constants/complaint.constants.js";

const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

export const verifyGoogleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new AppError("Google credential is required", 400);
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new AppError("GOOGLE_CLIENT_ID is missing in backend environment variables", 503);
  }

  const response = await fetch(
    `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(credential)}`
  );

  if (!response.ok) {
    throw new AppError("Google token verification failed", 401);
  }

  const payload = await response.json();

  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new AppError("Google credential audience mismatch", 401);
  }

  if (!["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) {
    throw new AppError("Google credential issuer is invalid", 401);
  }

  if (payload.email_verified !== "true") {
    throw new AppError("Google email is not verified", 401);
  }

  const complaintToken = jwt.sign(
    {
      email: payload.email,
      googleSub: payload.sub,
      purpose: VERIFICATION_PURPOSES.COMPLAINT,
    },
    process.env.JWT_SECRET || "aqi-complaint-secret",
    {
      expiresIn: process.env.COMPLAINT_TOKEN_EXPIRY || "30m",
    }
  );

  return sendSuccess(res, 200, "Google account verified successfully", {
    complaintToken,
    profile: {
      email: payload.email,
      fullName: payload.name || "",
      picture: payload.picture || "",
      googleSub: payload.sub,
    },
    verifiedAt: new Date().toISOString(),
  });
});
