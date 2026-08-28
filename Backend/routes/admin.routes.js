import { Router } from "express";
import {
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
  getAdminStats,
} from "../controllers/admin.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  updateUserAdminSchema,
  userIdParamSchema,
} from "../validators/admin.validator.js";

const router = Router();

// Apply Auth and Admin protection globally to all admin routes
router.use(protect);
router.use(authorizeRoles("admin"));

// Dashboard Statistics
router.get("/stats", getAdminStats);

// User Management Routes
router.get("/users", getAllUsers);
router.patch(
  "/users/:userId",
  validateRequest(updateUserAdminSchema),
  updateUserByAdmin
);
router.delete(
  "/users/:userId",
  validateRequest(userIdParamSchema),
  deleteUserByAdmin
);

export default router;