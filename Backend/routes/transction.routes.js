import express, { Router } from "express";
import {
  createCheckoutSession,
  handleLemonSqueezyWebhook,
  getUserTransactions,
  getAllTransactions,
} from "../controllers/transaction.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { transactionQuerySchema } from "../validators/transction.validator.js";

const router = Router();

// 1. Webhook Route (Public & Uses Raw Body)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body.toString("utf8");
      try {
        req.body = JSON.parse(req.rawBody);
      } catch (e) {
        req.body = {};
      }
    }
    next();
  },
  handleLemonSqueezyWebhook
);

// 2. User Protected Routes
router.post("/create-checkout", protect, createCheckoutSession);
router.get("/history", protect, getUserTransactions);

// 3. Admin Protected Route (With Query Validation)
router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  validateRequest(transactionQuerySchema),
  getAllTransactions
);

export default router;
