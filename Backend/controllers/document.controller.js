import { Document } from "../models/Document.model.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/imagekit.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

/**
 * Upload a PDF file
 */
export const uploadPdf = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Please upload a PDF file");
  }

  if (req.file.mimetype !== "application/pdf") {
    throw new ApiError(400, "File must be in PDF format");
  }

  // Upload to ImageKit in the '/pdfs' folder
  const { url, fileId } = await uploadToImageKit(req.file, "/pdfs");

  // Save reference to MongoDB
  const document = await Document.create({
    user: req.user._id,
    fileName: req.file.originalname,
    pdfUrl: url,
    pdfFileId: fileId,
  });

  res.status(201).json({
    success: true,
    message: "PDF uploaded successfully",
    data: document,
  });
});

/**
 * Delete a PDF file
 */
export const deletePdf = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const document = await Document.findById(documentId);
  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Ensure authorized user owns the file
  if (document.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this document");
  }

  // 1. Delete from ImageKit
  if (document.pdfFileId) {
    await deleteFromImageKit(document.pdfFileId);
  }

  // 2. Delete from MongoDB
  await document.deleteOne();

  res.status(200).json({
    success: true,
    message: "PDF deleted successfully",
  });
});