import { User } from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Helper function to call OpenRouter Chat Completions API
const callOpenRouter = async (messages) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

  if (!apiKey) {
    throw new ApiError(500, "OpenRouter API Key is missing in environment variables");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5000",
      "X-Title": "Resume Builder AI",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      `OpenRouter API Error: ${errorData?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim();
};

/**
 * @desc    Generate professional resume summary options using OpenRouter
 * @route   POST /api/v1/ai/generate-summary
 * @access  Private
 */
export const generateSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const currentPlan = user.plan || user.subscriptionPlan || "free";

  // Free tier usage limit check (Max 5 generations)
  if (currentPlan === "free" && user.aiGenerationsUsed >= 5) {
    throw new ApiError(
      403,
      "Free tier AI limit reached (5 generations max). Upgrade to Premium for unlimited AI suggestions."
    );
  }

  const { jobTitle, experienceLevel = "intermediate", keySkills = [] } = req.body;

  if (!jobTitle) {
    throw new ApiError(400, "Job title is required to generate a summary");
  }

  const messages = [
    {
      role: "system",
      content:
        "You are an expert ATS resume writer. Output ONLY a valid JSON array of strings containing 3 distinct professional summary options. Do not include markdown or extra text.",
    },
    {
      role: "user",
      content: `Write 3 concise, impact-driven resume summaries for a ${jobTitle} with ${experienceLevel} level experience and skills in ${
        keySkills.length > 0 ? keySkills.join(", ") : "general competencies"
      }.`,
    },
  ];

  const rawResponse = await callOpenRouter(messages);

  let summaries = [];
  try {
    const cleanedText = rawResponse.replace(/```json|```/g, "").trim();
    summaries = JSON.parse(cleanedText);
  } catch (err) {
    summaries = [rawResponse];
  }

  // Increment usage count for Free tier users
  if (currentPlan === "free") {
    user.aiGenerationsUsed = (user.aiGenerationsUsed || 0) + 1;
    await user.save();
  }

  return new ApiResponse(200, "AI summaries generated successfully", {
    summaries,
    remainingGenerations:
      currentPlan === "free" ? Math.max(0, 5 - user.aiGenerationsUsed) : "unlimited",
  }).send(res);
});

/**
 * @desc    Enhance experience bullet points using OpenRouter
 * @route   POST /api/v1/ai/enhance-bullet
 * @access  Private
 */
export const enhanceBulletPoint = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const currentPlan = user.plan || user.subscriptionPlan || "free";

  if (currentPlan === "free" && user.aiGenerationsUsed >= 5) {
    throw new ApiError(
      403,
      "Free tier AI limit reached. Upgrade to Premium for unlimited AI usage."
    );
  }

  const { rawBullet } = req.body;

  if (!rawBullet) {
    throw new ApiError(400, "Please provide bullet point text to enhance");
  }

  const messages = [
    {
      role: "system",
      content:
        "You are an executive resume writer. Return ONLY the improved bullet point as plain text without quotes or markdown formatting.",
    },
    {
      role: "user",
      content: `Rewrite this resume bullet point to make it quantifiable, high-impact, and ATS-friendly: "${rawBullet}"`,
    },
  ];

  const enhancedText = await callOpenRouter(messages);

  if (currentPlan === "free") {
    user.aiGenerationsUsed = (user.aiGenerationsUsed || 0) + 1;
    await user.save();
  }

  return new ApiResponse(200, "Bullet point enhanced successfully", {
    enhancedText,
    remainingGenerations:
      currentPlan === "free" ? Math.max(0, 5 - user.aiGenerationsUsed) : "unlimited",
  }).send(res);
});

/**
 * @desc    Calculate ATS Resume Match Score against Job Description using OpenRouter
 * @route   POST /api/v1/ai/ats-score
 * @access  Private
 */
export const calculateAtsScore = asyncHandler(async (req, res) => {
  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    throw new ApiError(400, "Both resume text and job description are required");
  }

  const messages = [
    {
      role: "system",
      content:
        "Act as an ATS scanner. Output ONLY a raw JSON object with keys: 'score' (0-100), 'matchedKeywords' (array), 'missingKeywords' (array), and 'recommendations' (array of 3 tips). Do not use markdown backticks.",
    },
    {
      role: "user",
      content: `Resume:\n"""${resumeText}"""\n\nJob Description:\n"""${jobDescription}"""`,
    },
  ];

  const rawResponse = await callOpenRouter(messages);

  let analysisData = {};
  try {
    const cleanedText = rawResponse.replace(/```json|```/g, "").trim();
    analysisData = JSON.parse(cleanedText);
  } catch (err) {
    throw new ApiError(500, "Failed to parse ATS scoring result from AI service");
  }

  return new ApiResponse(200, "ATS score calculated successfully", analysisData).send(res);
});