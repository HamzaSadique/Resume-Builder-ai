import ApiError from "../utils/ApiError.js";

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace req properties with clean, validated & sanitized data
    req.body = parsed.body || req.body;
    req.query = parsed.query || req.query;
    req.params = parsed.params || req.params;

    next();
  } catch (error) {
    if (error.name === "ZodError" || error.issues) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.slice(1).join("."), // Omit 'body' or 'query' prefix
        message: issue.message,
      }));

      return next(new ApiError(422, "Input validation failed", formattedErrors));
    }
    next(error);
  }
};