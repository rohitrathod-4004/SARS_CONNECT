import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      default: "",
      maxlength: 500
    },
    groupPic: {
      type: String,
      default: ""
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
