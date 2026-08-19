import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // ALWAYS log the error in development so you can see it in terminal console
  if (process.env.NODE_ENV !== "production") {
    console.error("🔥 Global Error Caught:", err);
  }

  // Ensure 'error' is an instance of ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.status ? error.status : 500);
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // 1. Handle Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Resource not found with ID of ${err.value}`;
    error = new ApiError(404, message);
  }

  // 2. Handle Mongoose Duplicate Key Error (e.g., duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const message = `A record with this ${field} already exists`;
    error = new ApiError(400, message);
  }

  // 3. Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors || {}).map((val) => val.message);
    error = new ApiError(400, "Validation Error", errors);
  }

  // 4. Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token signature");
  }

  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Token has expired, please log in again");
  }

  // Final Response Output
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    statusCode,
    message: error.message || "Internal Server Error",
    errors: error.errors || [],
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };

  return res.status(statusCode).json(response);
};