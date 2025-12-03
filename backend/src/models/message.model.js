import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // For direct messages
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // For group messages
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    messageType: {
      type: String,
      enum: ["direct", "group"],
      required: true,
      default: "direct"
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    video: {
      type: String,
    },
  },
  { timestamps: true }
);

// Validation: Either receiverId or groupId must be present
messageSchema.pre('save', function(next) {
  if (!this.receiverId && !this.groupId) {
    next(new Error('Message must have either receiverId or groupId'));
  } else if (this.receiverId && this.groupId) {
    next(new Error('Message cannot have both receiverId and groupId'));
  } else {
    next();
  }
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
