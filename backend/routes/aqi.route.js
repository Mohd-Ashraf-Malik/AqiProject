import express from "express";
import { requestOtp, verifyOtp } from "../controllers/otp.controller.js";
import {
  getComplaintMeta,
  registerComplaint,
} from "../controllers/complaint.controller.js";
import { getNearbyStation } from "../controllers/station.controller.js";
import { seedMunicipalities } from "../controllers/municipality.controller.js";
import validateComplaintToken from "../middleware/validate-complaint-token.middleware.js";
import { complaintUpload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AQI API healthy",
  });
});

router.post("/otp/request", requestOtp);
router.post("/otp/verify", verifyOtp);

router.get("/complaints/meta", getComplaintMeta);
router.post(
  "/complaints",
  validateComplaintToken,
  complaintUpload.single("image"),
  registerComplaint
);

router.get("/stations/nearby", getNearbyStation);

router.post("/seed/municipalities", seedMunicipalities);

export default router;
