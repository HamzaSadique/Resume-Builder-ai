import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    pdfFileId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Document = mongoose.model("Document", documentSchema);