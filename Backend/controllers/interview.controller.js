import Interview from "../models/Interview.model.js";
import openai from "../config/openrouter.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Save finished interview & generate evaluation
export const saveInterview = asyncHandler(async (req, res) => {
  const { topic, transcript } = req.body;
  const userId = req.user._id;

  // Since you have express-validator, this is a fallback, but good practice
  if (!topic || !transcript || !Array.isArray(transcript)) {
    throw new ApiError(400, "Invalid payload. Topic and transcript are required.");
  }

  // 1. Generate score & feedback via OpenRouter AI
  const prompt = `You are a strict technical recruiter. Review this interview transcript for the topic "${topic}".
1. Provide a brief paragraph of constructive feedback.
2. Give a final score out of 100 based on technical accuracy and communication.
Transcript:
${JSON.stringify(transcript, null, 2)}`;

  let aiResponse;
  try {
    aiResponse = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
  } catch (error) {
    throw new ApiError(500, "Failed to connect to AI for evaluation.");
  }

  if (!aiResponse || !aiResponse.choices || aiResponse.choices.length === 0) {
    throw new ApiError(500, "AI failed to return an evaluation.");
  }

  const evalContent = aiResponse.choices[0].message.content;

  // 2. Save the interview to the database
  const interview = await Interview.create({
    userId,
    topic,
    transcript,
    feedback: evalContent,
    score: 0, // Optionally add regex logic later to extract the number from evalContent
  });

  if (!interview) {
    throw new ApiError(500, "Failed to save the interview to the database.");
  }

  // 3. Return success response
  return res.status(201).json(
    new ApiResponse(201, interview, "Interview saved and evaluated successfully.")
  );
});

// Fetch user history
export const getUserInterviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });

  if (!interviews) {
    throw new ApiError(404, "No interviews found for this user.");
  }

  return res.status(200).json(
    new ApiResponse(200, interviews, "User interviews fetched successfully.")
  );
});