import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadPdfMiddleware } from "../middlewares/multer.middleware.js";
import { requireFile } from "../middlewares/validateFile.middleware.js";
import { uploadPdf } from "../controllers/document.controller.js";

const router = Router();

router.post(
  "/upload-pdf",
  protect, // 1. Verify Authentication
  uploadPdfMiddleware.single("document"), // 2. Parse & Validate PDF MIME type and size
  requireFile("document"), // 3. Ensure file exists on req.file
  uploadPdf // 4. Process Upload to ImageKit
);

export default router;