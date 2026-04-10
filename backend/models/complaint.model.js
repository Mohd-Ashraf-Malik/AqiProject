import mongoose from "mongoose";
import { COMPLAINT_CHALLENGES } from "../constants/complaint.constants.js";

const complaintSchema = new mongoose.Schema(
  {
    complainantName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    challenges: {
      type: [String],
      enum: COMPLAINT_CHALLENGES,
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one pollution challenge must be selected",
      },
    },
    image: {
      secureUrl: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      addressLabel: {
        type: String,
        trim: true,
      },
    },
    assignedStation: {
      stationCode: {
        type: String,
        required: true,
        trim: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      sourceType: {
        type: String,
        enum: ["iot", "government"],
        required: true,
      },
      currentAqi: {
        type: Number,
        default: null,
      },
      distanceInKm: {
        type: Number,
        required: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
    },
    municipality: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Municipality",
      required: true,
    },
    verification: {
      otpVerificationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OtpVerification",
        required: true,
      },
      verifiedAt: {
        type: Date,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["registered", "forwarded", "resolved", "rejected"],
      default: "registered",
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

complaintSchema.index({ phoneNumber: 1, createdAt: -1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
