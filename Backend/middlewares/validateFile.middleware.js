import ApiError from "../utils/ApiError.js";

export const requireFile = (fieldName = "file") => {
  return (req, res, next) => {
    if (!req.file) {
      throw new ApiError(400, `Please select a ${fieldName} to upload`);
    }
    next();
  };
};