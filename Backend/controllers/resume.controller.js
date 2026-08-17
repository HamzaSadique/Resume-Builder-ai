import Resume from "../models/Resume.model.js";
import User from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Create a new resume (Enforces Free Tier vs Premium limits)
 * @route   POST /api/resumes
 * @access  Private
 */
export const createResume = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch user to verify subscription status
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 2. Check Free Tier limits (Max 2 resumes)
  const resumeCount = await Resume.countDocuments({ userId });
  const FREE_TIER_LIMIT = 2;

  if (user.subscriptionPlan === "free" && resumeCount >= FREE_TIER_LIMIT) {
    throw new ApiError(
      403,
      `Free tier limit reached (${FREE_TIER_LIMIT} resumes max). Please upgrade to Premium.`
    );
  }

  // 3. Extract resume details
  const {
    title = "Untitled Resume",
    templateId = "classic",
    themeColor = "#000000",
    fontStyle = "Roboto",
    personalInfo = {},
    summary = "",
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    languages = [],
    customSections = [],
  } = req.body;

  // 4. Save new resume
  const newResume = await Resume.create({
    userId,
    title,
    templateId,
    themeColor,
    fontStyle,
    personalInfo,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages,
    customSections,
  });

  return new ApiResponse(201, "Resume created successfully", newResume).send(res);
});

/**
 * @desc    Get all resumes for logged-in user
 * @route   GET /api/resumes
 * @access  Private
 */
export const getUserResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id })
    .select("title templateId updatedAt createdAt themeColor")
    .sort({ updatedAt: -1 });

  return new ApiResponse(200, "Resumes fetched successfully", resumes).send(res);
});

/**
 * @desc    Get single resume by ID
 * @route   GET /api/resumes/:id
 * @access  Private
 */
export const getResumeById = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }

  if (resume.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized access to this resume");
  }

  return new ApiResponse(200, "Resume retrieved successfully", resume).send(res);
});

/**
 * @desc    Update an existing resume
 * @route   PUT /api/resumes/:id
 * @access  Private
 */
export const updateResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }

  if (resume.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized access to modify this resume");
  }

  const updatedResume = await Resume.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  return new ApiResponse(200, "Resume updated successfully", updatedResume).send(res);
});

/**
 * @desc    Duplicate an existing resume
 * @route   POST /api/resumes/:id/duplicate
 * @access  Private
 */
export const duplicateResume = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  const resumeCount = await Resume.countDocuments({ userId });

  if (user.subscriptionPlan === "free" && resumeCount >= 2) {
    throw new ApiError(403, "Free tier limit reached. Upgrade to Premium to duplicate resumes.");
  }

  const existingResume = await Resume.findById(req.params.id);

  if (!existingResume) {
    throw new ApiError(404, "Resume not found");
  }

  if (existingResume.userId.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }

  const resumeObject = existingResume.toObject();
  delete resumeObject._id;
  delete resumeObject.createdAt;
  delete resumeObject.updatedAt;

  resumeObject.title = `${existingResume.title} (Copy)`;

  const duplicatedResume = await Resume.create(resumeObject);

  return new ApiResponse(201, "Resume duplicated successfully", duplicatedResume).send(res);
});

/**
 * @desc    Delete a resume
 * @route   DELETE /api/resumes/:id
 * @access  Private
 */
export const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }

  if (resume.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }

  await resume.deleteOne();

  return new ApiResponse(200, "Resume deleted successfully", null).send(res);
});