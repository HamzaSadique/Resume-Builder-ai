import { Router } from "express";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers,
} from "../controllers/newsletter.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { strictLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  subscribeNewsletterSchema,
  unsubscribeNewsletterSchema,
} from "../validators/newsletter.validator.js";

const router = Router();

// Public Routes
router.post(
  "/subscribe",
  strictLimiter,
  validateRequest(subscribeNewsletterSchema),
  subscribeNewsletter
);

router.post(
  "/unsubscribe",
  strictLimiter,
  validateRequest(unsubscribeNewsletterSchema),
  unsubscribeNewsletter
);

// Admin-Only Route
router.get(
  "/subscribers",
  protect,
  authorizeRoles("admin"),
  getAllSubscribers
);

export default router;