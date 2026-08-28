import dotenv from "dotenv";
import http from "http"; 
import connectDB from "./config/db.js";
import { app } from "./app.js";
import initSocket from "./config/socket.config.js"; 

dotenv.config();

const PORT = process.env.PORT || 8000;

// Connect Database & Start Server
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("Express App Error:", error);
      throw error;
    });

    // 3. CREATE HTTP SERVER WRAPPING EXPRESS APP
    const server = http.createServer(app);

    // 4. INITIALIZE SOCKET.IO ON THE HTTP SERVER
    initSocket(server);

    // 5. USE server.listen INSTEAD OF app.listen
    server.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err);
    process.exit(1);
  });