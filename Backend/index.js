import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { app } from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

// Connect Database & Start Server
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("Express App Error:", error);
      throw error;
    });

    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err);
    process.exit(1);
  });