import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Route Imports

const app = express();


// -------------------------------------------------------------
// Lemon Squeezy signatures require the exact unparsed raw body buffer

// -------------------------------------------------------------
// 2. Global Middlewares
// -------------------------------------------------------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// -------------------------------------------------------------
// 3. Health Check Route
// -------------------------------------------------------------
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// -------------------------------------------------------------
// 4. API Routes Mounting
// -------------------------------------------------------------


// -------------------------------------------------------------
// 5. Global Error Handling Middleware
// -------------------------------------------------------------
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export { app };