import express from "express";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import "./config/passport.js";

// Middleware Imports
import { errorHandler } from "./middlewares/error.middleware.js";
import ApiError from "./utils/ApiError.js";

// Route Imports
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import documentRouter from "./routes/document.routes.js";
import newsletterRouter from "./routes/newsletter.routes.js";
import resumeRouter from "./routes/resume.routes.js";
import transactionRouter from "./routes/transaction.routes.js";
import aiRouter from "./routes/ai.routes.js";

const app = express();

// -------------------------------------------------------------
// 1. Core & Security Middlewares
// -------------------------------------------------------------
app.use(passport.initialize());
app.use(helmet());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// -------------------------------------------------------------
// 2. Health Check Route
// -------------------------------------------------------------
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// -------------------------------------------------------------
// 3. API Routes Mounting
// -------------------------------------------------------------
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/documents", documentRouter);
app.use("/api/v1/newsletter", newsletterRouter);
app.use("/api/v1/resume", resumeRouter);
app.use("/api/v1/transaction", transactionRouter);
app.use("/api/v1/ai", aiRouter);

// -------------------------------------------------------------
// 4. Catch-All for Unhandled Routes (404)
// -------------------------------------------------------------
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// -------------------------------------------------------------
// 5. Global Error Handling Middleware (SINGLE POINT OF EXIT)
// -------------------------------------------------------------
app.use(errorHandler);

export { app };