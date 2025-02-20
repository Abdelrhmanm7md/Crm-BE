import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, // Who performed the action
    action: { type: String, required: true }, // e.g., "create_task", "update_project"
    targetModel: { type: String, required: true }, // e.g., "Task", "Project"
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the affected document
    before: { type: Object }, // Previous state (for updates)
    after: { type: Object }, // New state (for updates)
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
logSchema.pre("find", function () {
  this.populate("user");
  this.populate("targetId");
})

export const logModel = mongoose.model("log", logSchema);
