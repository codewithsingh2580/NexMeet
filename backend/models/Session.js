import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
    },
    socketId: {
      type: String,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
