import crypto from "crypto";
import {
  lemonSqueezySetup,
  createCheckout,
} from "@lemonsqueezy/lemonsqueezy.js";
import Transaction from "../models/Transaction.model.js";
import { User } from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Initialize Lemon Squeezy API
lemonSqueezySetup({
  apiKey: process.env.LEMON_SQUEEZY_API_KEY,
  onError: (error) => console.error("Lemon Squeezy Error:", error),
});

/**
 * @desc    Create a Lemon Squeezy Hosted Checkout Link for Premium Subscription
 * @route   POST /api/transactions/create-checkout
 * @access  Private
 */
export const createCheckoutSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const currentPlan = user.plan || user.subscriptionPlan || "free";
  if (currentPlan === "premium") {
    throw new ApiError(400, "You are already subscribed to the Premium plan");
  }

  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

  if (!storeId || !variantId) {
    throw new ApiError(500, "Lemon Squeezy Store configuration is missing");
  }

  // Create checkout session with user metadata attached
  const checkout = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: user.email,
      custom: {
        user_id: userId.toString(),
      },
    },
    productOptions: {
      redirectUrl: `${process.env.CLIENT_URL}/dashboard?payment=success`,
    },
  });

  if (checkout.error) {
    throw new ApiError(
      500,
      `Checkout creation failed: ${checkout.error.message}`
    );
  }

  const checkoutUrl = checkout.data?.data?.attributes?.url;

  return new ApiResponse(200, "Lemon Squeezy Checkout link generated", {
    checkoutUrl,
  }).send(res);
});

/**
 * @desc    Lemon Squeezy Webhook Listener (Handles order_created & subscription_created)
 * @route   POST /api/transactions/webhook
 * @access  Public (X-Signature verification enforced)
 */
export const handleLemonSqueezyWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    throw new ApiError(500, "Webhook secret key is not set in environment variables");
  }

  const hmac = crypto.createHmac("sha256", secret);
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(req.headers["x-signature"] || "", "utf8");

  // Verify HMAC SHA256 Signature
  if (
    signature.length !== digest.length ||
    !crypto.timingSafeEqual(digest, signature)
  ) {
    throw new ApiError(400, "Invalid Lemon Squeezy Webhook Signature");
  }

  const payload = req.body;
  const eventName = payload.meta?.event_name;
  const customData = payload.meta?.custom_data;
  const userId = customData?.user_id;

  // Process order or subscription fulfillment
  if (
    (eventName === "order_created" || eventName === "subscription_created") &&
    userId
  ) {
    const attributes = payload.data?.attributes;
    const totalAmount = (attributes?.total || 0) / 100; // Cents to currency format
    const orderId = payload.data?.id;

    // 1. Record Transaction
    await Transaction.create({
      userId,
      lemonSqueezyOrderId: orderId,
      amount: totalAmount,
      currency: attributes?.currency || "USD",
      paymentStatus: attributes?.status || "paid",
      planType: "premium",
    });

    // 2. Upgrade User Account
    await User.findByIdAndUpdate(userId, {
      subscriptionPlan: "premium",
      plan: "premium",
      aiGenerationsUsed: 0,
    });
  }

  return res.status(200).json({ received: true });
});

/**
 * @desc    Get logged-in user's transaction history
 * @route   GET /api/transactions/history
 * @access  Private
 */
export const getUserTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });

  return new ApiResponse(200, "Payment history retrieved successfully", {
    transactions,
  }).send(res);
});

/**
 * @desc    Get all transactions (Admin view)
 * @route   GET /api/transactions/admin/all
 * @access  Private / Admin
 */
export const getAllTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const transactions = await Transaction.find()
    .populate("userId", "fullName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalTransactions = await Transaction.countDocuments();

  return new ApiResponse(200, "All transactions fetched successfully", {
    total: totalTransactions,
    page,
    totalPages: Math.ceil(totalTransactions / limit),
    transactions,
  }).send(res);
});