import mongoose from "mongoose";

const DEFAULT_DB_NAME = "aqi-monitoring";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("DB Connected");
  });

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME,
  });
};

export default connectDB;
