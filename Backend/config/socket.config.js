import { Server } from "socket.io";
import openai from "./openrouter.js";

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Maintain conversation history scoped to this specific socket connection
    let conversation = [];

    // 1. Start Interview Session
    socket.on("start_session", ({ topic }) => {
      conversation = [
        {
          role: "system",
          content: `You are an expert technical interviewer conducting a mock interview on the topic: ${topic}. 
          Ask clear, professional questions one at a time. Do not provide the answers. 
          Critique or acknowledge the user's previous answer briefly before asking the next question. Keep responses concise.`,
        },
      ];

      const welcomeMessage = `Welcome to your ${topic} mock interview. Let's get started. Could you briefly introduce yourself and your experience with ${topic}?`;
      
      conversation.push({ role: "assistant", content: welcomeMessage });
      
      // Send initial greeting to frontend
      socket.emit("ai_message", { message: welcomeMessage });
    });

    // 2. Handle User's Spoken Answer
    socket.on("user_answer", async ({ text }) => {
      if (!text) return;
      
      conversation.push({ role: "user", content: text });

      try {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
          messages: conversation,
        });

        const aiReply = completion.choices[0].message.content;
        conversation.push({ role: "assistant", content: aiReply });

        socket.emit("ai_message", { message: aiReply });
      } catch (err) {
        console.error("Socket OpenRouter Error:", err.message);
        socket.emit("error", { message: "AI failed to generate a response. Please try again." });
      }
    });

    // 3. Cleanup on Disconnect
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      conversation = [];
    });
  });

  return io;
};

export default initSocket;