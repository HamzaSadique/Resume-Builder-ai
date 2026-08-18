import imagekit from "../config/imagekit.js";
import ApiError from "./ApiError.js";

/**
 * Uploads any file buffer (PDF or Image) to ImageKit
 */
export const uploadToImageKit = async (file, folder = "/documents") => {
  if (!file) throw new ApiError(400, "No file provided for upload");

  try {
    const response = await imagekit.upload({
      file: file.buffer, // Pass buffer directly from Multer
      fileName: `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`,
      folder: folder,
    });

    return {
      url: response.url,
      fileId: response.fileId,
    };
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    throw new ApiError(500, "Failed to upload file to ImageKit");
  }
};

/**
 * Deletes a file from ImageKit by fileId
 */
export const deleteFromImageKit = async (fileId) => {
  if (!fileId) return;
  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error("ImageKit Delete Error:", error);
  }
};