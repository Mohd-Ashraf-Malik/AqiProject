import Municipality from "../models/municipality.model.js";
import asyncHandler from "../utils/async-handler.js";
import AppError from "../utils/app-error.js";
import { sendSuccess } from "../utils/api-response.js";
import municipalitySeedData from "../data/municipalities.seed.json" with { type: "json" };

export const seedMunicipalities = asyncHandler(async (req, res) => {
  const { municipalities = [] } = req.body;

  if (!Array.isArray(municipalities)) {
    throw new AppError("municipalities must be an array", 400);
  }

  for (const municipalityPayload of municipalities) {
    if (!municipalityPayload?.name || !municipalityPayload?.city) {
      throw new AppError("Each municipality must include name and city", 400);
    }

    await Municipality.findOneAndUpdate(
      {
        name: municipalityPayload.name,
        city: municipalityPayload.city,
      },
      municipalityPayload,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );
  }

  return sendSuccess(res, 201, "Municipality mappings saved successfully", {
    municipalities: municipalities.length,
  });
});

export const seedDefaultMunicipalities = asyncHandler(async (req, res) => {
  for (const municipalityPayload of municipalitySeedData) {
    await Municipality.findOneAndUpdate(
      {
        name: municipalityPayload.name,
        city: municipalityPayload.city,
      },
      municipalityPayload,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );
  }

  return sendSuccess(res, 201, "Default municipality mappings saved successfully", {
    municipalities: municipalitySeedData.length,
    cities: municipalitySeedData.map((item) => item.city),
  });
});
