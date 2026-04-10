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

  try {
    const { default: Municipality } = await import("../models/municipality.model.js");
    if (await Municipality.countDocuments() === 0) {
      console.log("Seeding municipalities dataset...");
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.resolve("./data/municipalities.seed.json");
      const seedData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      await Municipality.insertMany(seedData);
      console.log("Municipalities seeded successfully.");
    }
  } catch (err) {
    console.error("Failed to mock seed municipalities:", err.message);
  }
};

export default connectDB;
