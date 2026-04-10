import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import aqiRouter from "./routes/aqi.route.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

// App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174"
    ],
    credentials: true
  }));
app.use(cookieParser());
app.use(helmet());

app.use("/api/v1", aqiRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AQI backend is running",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log("Server started on PORT: " + port);
});
