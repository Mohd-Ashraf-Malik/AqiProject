import express from "express";
import { verifyGoogleAuth } from "../controllers/auth.controller.js";
import {
  getComplaintMeta,
  getComplaintStats,
  registerComplaint,
} from "../controllers/complaint.controller.js";
import {
  getCityComparison,
  getHeatmapStations,
  getNearbyStation,
} from "../controllers/station.controller.js";
import {
  seedDefaultMunicipalities,
  seedMunicipalities,
} from "../controllers/municipality.controller.js";
import validateComplaintToken from "../middleware/validate-complaint-token.middleware.js";
import { complaintUpload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AQI API healthy",
  });
});

router.post("/auth/google/verify", verifyGoogleAuth);

router.get("/complaints/meta", getComplaintMeta);
router.get("/complaints/stats", getComplaintStats);
router.post(
  "/complaints",
  validateComplaintToken,
  complaintUpload.single("image"),
  registerComplaint
);

router.get("/stations/nearby", getNearbyStation);
router.get("/stations/heatmap", getHeatmapStations);
router.get("/cities/compare", getCityComparison);

router.post("/seed/municipalities", seedMunicipalities);
router.post("/seed/municipalities/defaults", seedDefaultMunicipalities);

export default router;
