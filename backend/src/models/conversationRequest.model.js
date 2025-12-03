import mongoose from "mongoose";

const conversationRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "blocked"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      // Optional: Set to 7 days from creation
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate requests
conversationRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Validation: Prevent self-requests
conversationRequestSchema.pre("save", function (next) {
  if (this.requester.toString() === this.recipient.toString()) {
    next(new Error("Cannot send chat request to yourself"));
  } else {
    next();
  }
});

const ConversationRequest = mongoose.model("ConversationRequest", conversationRequestSchema);

export default ConversationRequest;
