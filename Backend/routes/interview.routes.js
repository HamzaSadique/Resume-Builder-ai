import { Router } from "express";
import {
  saveInterview,
  getUserInterviews,
} from "../controllers/interview.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { saveInterviewSchema } from "../validators/interview.validator.js";

const router = Router();

// ==========================================
// PROTECTED INTERVIEW ROUTES
// ==========================================

router.post(
  "/save",
  protect,
  validateRequest(saveInterviewSchema),
  saveInterview
);

router.get(
  "/my-interviews",
  protect,
  getUserInterviews
);

export default router;