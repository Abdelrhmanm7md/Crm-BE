import mongoose from "mongoose";
import { logModel } from "./log.model.js";

const expensesSchema = mongoose.Schema(
  {
    reason: {
      type: String,
      required: [true, "required field."],
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },
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


expensesSchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Expenses",
    targetModel: "Expenses",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

expensesSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const expensesId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!expensesId) return next();

  const beforeUpdate = await this.model.findById(expensesId).lean();
  if (!beforeUpdate) return next(); // If expenses doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update expenses",
      targetModel: "Expenses",
      targetId: expensesId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging expenses update:", error);
  }

  next();
});

expensesSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Expenses",
      targetModel: "Expenses",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

export const expensesModel = mongoose.model("expenses", expensesSchema);
