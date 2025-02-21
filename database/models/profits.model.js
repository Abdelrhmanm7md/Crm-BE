import mongoose from "mongoose";
import { logModel } from "./log.model.js";

const profitSchema = mongoose.Schema(
  {
    amount: {
      type: Number,
      min : 0,
      required: [true, "Amount is a required field."],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);


profitSchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Profit",
    targetModel: "Profit",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

profitSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const profitId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!profitId) return next();

  const beforeUpdate = await this.model.findById(profitId).lean();
  if (!beforeUpdate) return next(); // If profit doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update profit",
      targetModel: "Profit",
      targetId: profitId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging profit update:", error);
  }

  next();
});

profitSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Profit",
      targetModel: "Profit",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

export const profitModel = mongoose.model("profit", profitSchema);
