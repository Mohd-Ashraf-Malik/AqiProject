import mongoose from "mongoose";
import { OTP_PURPOSES } from "../constants/complaint.constants.js";

const otpVerificationSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: Object.values(OTP_PURPOSES),
      default: OTP_PURPOSES.COMPLAINT,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    requestMetadata: {
      ipAddress: String,
      userAgent: String,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

otpVerificationSchema.index({ phoneNumber: 1, purpose: 1, createdAt: -1 });

const OtpVerification = mongoose.model("OtpVerification", otpVerificationSchema);

export default OtpVerification;
