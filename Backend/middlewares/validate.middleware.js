import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const validateRequest = (schema) => (req, res, next) => {
  try {
    if (!schema) {
      return next(new ApiError(500, "Validation schema is missing"));
    }

    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) {
      req.body = parsed.body;
    }

    if (parsed.query && req.query) {
      Object.assign(req.query, parsed.query);
    }

    if (parsed.params && req.params) {
      Object.assign(req.params, parsed.params);
    }

    return next();
  } catch (error) {
    if (error.name === "ZodError" || error.issues) {
      const formattedErrors = (error.issues || []).map((issue) => ({
        field: issue.path.slice(1).join("."),
        message: issue.message,
      }));

      return next(new ApiError(422, "Input validation failed", formattedErrors));
    }
    return next(error);
  }
};