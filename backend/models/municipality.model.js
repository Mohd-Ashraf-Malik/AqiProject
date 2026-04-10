import mongoose from "mongoose";

const municipalitySchema = new mongoose.Schema(
  {
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
    wardCode: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    stationMappings: [
      {
        stationCode: {
          type: String,
          trim: true,
        },
        sourceType: {
          type: String,
          enum: ["iot", "government"],
        },
        city: {
          type: String,
          trim: true,
        },
        state: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    minimize: false,
  }
);

const Municipality = mongoose.model("Municipality", municipalitySchema);

export default Municipality;
