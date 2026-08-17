import { Router } from "express";
import {
  createResume,
  getUserResumes,
  getResumeById,
  updateResume,
  deleteResume,
  duplicateResume,
} from "../controllers/resume.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createResumeSchema,
  updateResumeSchema,
  resumeIdParamSchema,
} from "../validators/resume.validator.js";

const router = Router();

// Protect all resume routes
router.use(protect);

router
  .route("/")
  .post(validateRequest(createResumeSchema), createResume)
  .get(getUserResumes);

router
  .route("/:id")
  .get(validateRequest(resumeIdParamSchema), getResumeById)
  .put(
    validateRequest(resumeIdParamSchema),
    validateRequest(updateResumeSchema),
    updateResume
  )
  .delete(validateRequest(resumeIdParamSchema), deleteResume);

router.post(
  "/:id/duplicate",
  validateRequest(resumeIdParamSchema),
  duplicateResume
);

export default router;