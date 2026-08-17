import { Router } from "express";
import {
  generateSummary,
  enhanceBulletPoint,
  calculateAtsScore,
} from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { strictLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  generateSummarySchema,
  enhanceBulletSchema,
  atsScoreSchema,
} from "../validators/ai.validator.js";

const router = Router();

// Require authentication & rate limiting for all AI endpoints
router.use(protect);
router.use(strictLimiter);

router.post(
  "/generate-summary",
  validateRequest(generateSummarySchema),
  generateSummary
);

router.post(
  "/enhance-bullet",
  validateRequest(enhanceBulletSchema),
  enhanceBulletPoint
);

router.post(
  "/ats-score",
  validateRequest(atsScoreSchema),
  calculateAtsScore
);

export default router;