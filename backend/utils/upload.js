import { cloudinary } from "../config/cloudinary.js";
import AppError from "./app-error.js";

export const uploadBufferToCloudinary = async (buffer, folder, mimeType = "image/jpeg") => {
  if (!process.env.CLOUDINARY_NAME) {
    throw new AppError(
      "Image upload service is not configured. Add Cloudinary credentials first.",
      503
    );
  }

  const base64File = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(base64File, {
    folder,
    resource_type: "image",
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
};
