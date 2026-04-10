import jwt from "jsonwebtoken";
import AppError from "../utils/app-error.js";
import { COMPLAINT_TOKEN_PREFIX, OTP_PURPOSES } from "../constants/complaint.constants.js";

const validateComplaintToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith(COMPLAINT_TOKEN_PREFIX)
    ? authHeader.slice(COMPLAINT_TOKEN_PREFIX.length)
    : null;

  if (!token) {
    return next(new AppError("Complaint verification token is required", 401));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "aqi-complaint-secret"
    );

    if (decoded.purpose !== OTP_PURPOSES.COMPLAINT) {
      return next(new AppError("Invalid complaint verification token", 401));
    }

    req.complaintSession = decoded;
    next();
  } catch (error) {
    next(new AppError("Complaint verification token expired or invalid", 401));
  }
};

export default validateComplaintToken;
