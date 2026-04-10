import jwt from "jsonwebtoken";
import OtpVerification from "../models/otp-verification.model.js";
import asyncHandler from "../utils/async-handler.js";
import AppError from "../utils/app-error.js";
import { sendSuccess } from "../utils/api-response.js";
import { generateOtp, hashOtp } from "../utils/otp.js";
import { OTP_PURPOSES } from "../constants/complaint.constants.js";
import { sendOtpSms } from "../services/sms.service.js";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);

const normalizePhoneNumber = (phoneNumber) => {
  const trimmed = `${phoneNumber || ""}`.trim();

  if (!/^\+?[1-9]\d{9,14}$/.test(trimmed)) {
    throw new AppError(
      "Phone number must be a valid mobile number in international format",
      400
    );
  }

  return trimmed;
};

export const requestOtp = asyncHandler(async (req, res) => {
  const phoneNumber = normalizePhoneNumber(req.body.phoneNumber);

  const otpCode = generateOtp();
  const otpHash = hashOtp(phoneNumber, otpCode);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OtpVerification.deleteMany({
    phoneNumber,
    purpose: OTP_PURPOSES.COMPLAINT,
    verifiedAt: null,
  });

  const verification = await OtpVerification.create({
    phoneNumber,
    otpHash,
    purpose: OTP_PURPOSES.COMPLAINT,
    expiresAt,
    requestMetadata: {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    },
  });

  const delivery = await sendOtpSms({ phoneNumber, otpCode });

  return sendSuccess(res, 201, "OTP sent successfully", {
    verificationId: verification._id,
    expiresAt,
    delivery,
    ...(process.env.NODE_ENV !== "production" ? { otpCode } : {}),
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const phoneNumber = normalizePhoneNumber(req.body.phoneNumber);
  const { verificationId, otpCode } = req.body;

  if (!verificationId || !otpCode) {
    throw new AppError("verificationId and otpCode are required", 400);
  }

  const verification = await OtpVerification.findOne({
    _id: verificationId,
    phoneNumber,
    purpose: OTP_PURPOSES.COMPLAINT,
  });

  if (!verification) {
    throw new AppError("OTP verification request not found", 404);
  }

  if (verification.verifiedAt) {
    throw new AppError("OTP already used for verification", 409);
  }

  if (verification.expiresAt < new Date()) {
    throw new AppError("OTP has expired. Please request a new one.", 400);
  }

  const expectedHash = hashOtp(phoneNumber, otpCode);
  if (expectedHash !== verification.otpHash) {
    throw new AppError("Invalid OTP code", 400);
  }

  verification.verifiedAt = new Date();
  await verification.save();

  const complaintToken = jwt.sign(
    {
      phoneNumber,
      verificationId: verification._id.toString(),
      purpose: OTP_PURPOSES.COMPLAINT,
    },
    process.env.JWT_SECRET || "aqi-complaint-secret",
    {
      expiresIn: process.env.COMPLAINT_TOKEN_EXPIRY || "30m",
    }
  );

  return sendSuccess(res, 200, "Phone number verified successfully", {
    complaintToken,
    verifiedAt: verification.verifiedAt,
  });
});
