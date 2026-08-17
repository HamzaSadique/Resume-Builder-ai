import Newsletter from "../models/Newsletter.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Subscribe an email to the newsletter
 * @route   POST /api/newsletter/subscribe
 * @access  Public
 */
export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email address is required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists in database
  let subscriber = await Newsletter.findOne({ email: normalizedEmail });

  if (subscriber) {
    if (subscriber.isSubscribed) {
      return new ApiResponse(
        200,
        "You are already subscribed to our newsletter!",
        subscriber
      ).send(res);
    }

    // Re-subscribe if previously unsubscribed
    subscriber.isSubscribed = true;
    subscriber.subscribedAt = new Date();
    await subscriber.save();

    return new ApiResponse(
      200,
      "Welcome back! Your subscription has been reactivated.",
      subscriber
    ).send(res);
  }

  // Create new subscription record
  subscriber = await Newsletter.create({
    email: normalizedEmail,
    isSubscribed: true,
  });

  return new ApiResponse(
    201,
    "Successfully subscribed to the newsletter!",
    subscriber
  ).send(res);
});

/**
 * @desc    Unsubscribe an email from the newsletter
 * @route   POST /api/newsletter/unsubscribe
 * @access  Public
 */
export const unsubscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email address is required to unsubscribe");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const subscriber = await Newsletter.findOne({ email: normalizedEmail });

  if (!subscriber || !subscriber.isSubscribed) {
    throw new ApiError(404, "Active subscription not found for this email");
  }

  // Update subscription status instead of hard deleting for analytics history
  subscriber.isSubscribed = false;
  subscriber.unsubscribedAt = new Date();
  await subscriber.save();

  return new ApiResponse(
    200,
    "You have been successfully unsubscribed from our newsletter."
  ).send(res);
});

/**
 * @desc    Get all active newsletter subscribers (Admin Panel feature)
 * @route   GET /api/newsletter/subscribers
 * @access  Private / Admin
 */
export const getAllSubscribers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  const subscribers = await Newsletter.find({ isSubscribed: true })
    .select("email subscribedAt")
    .sort({ subscribedAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const totalSubscribers = await Newsletter.countDocuments({ isSubscribed: true });

  return new ApiResponse(200, "Subscribers retrieved successfully", {
    total: totalSubscribers,
    page: Number(page),
    totalPages: Math.ceil(totalSubscribers / limit),
    subscribers,
  }).send(res);
});