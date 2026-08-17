import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  changeCurrentPassword,
  deleteAccount,
  getAllUsersAdmin,
} from "../controllers/user.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/user.validator.js";

const router = Router();

// Protect all user routes
router.use(protect);

// Profile Operations
router.get("/profile", getUserProfile);

router.put(
  "/profile",
  validateRequest(updateProfileSchema),
  updateUserProfile
);

router.patch(
  "/change-password",
  validateRequest(changePasswordSchema),
  changeCurrentPassword
);

router.delete("/account", deleteAccount);

// Admin Only Operations
router.get("/admin/all", authorizeRoles("admin"), getAllUsersAdmin);

export default router;