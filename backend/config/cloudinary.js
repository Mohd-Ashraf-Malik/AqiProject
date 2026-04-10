import { v2 as cloudinary } from "cloudinary";

const connectCloudinary = async () => {
  if (
    !process.env.CLOUDINARY_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_SECRET_KEY
  ) {
    console.warn("Cloudinary credentials not found. Image uploads will be disabled.");
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
  });
};

export { cloudinary };
export default connectCloudinary;
