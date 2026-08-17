import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || "resume_builder_ai",
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(
      `MONGODB CONNECTED SUCCESSFULLY: ${connectionInstance.connection.host}`
    );

    // Monitor Connection Events
    mongoose.connection.on("error", (err) => {
      console.error(`[DATABASE] Connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[DATABASE] Connection lost. Reconnecting...");
    });

    // Graceful Shutdown on SIGINT
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("[DATABASE] Connection closed through app termination");
      process.exit(0);
    });

  } catch (error) {
    console.error("[DATABASE] Initial connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;