import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate webhook execution
    },
    orderId: {
      type: String,
      required: true,
    },
    eventName: {
      type: String,
      required: true, // e.g. order_created, subscription_created
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      required: true, // paid, refunded, failed
    },
    rawPayload: {
      type: Object, // Complete raw JSON object for audit history
    },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;