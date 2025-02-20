import generateUniqueId from "generate-unique-id";
import mongoose from "mongoose";
import { logModel } from "./log.model.js";

const supplierSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: [2, "too short supplier name"],
    },
    supplierCode: {
      type: String,
      uniqe: true,
      // required: true,
    },
    category: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "category",
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    debitAmount: {
      type: Number,
      // required: true,
    },
    creditAmount: {
      type: Number,
      // required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

supplierSchema.pre("save", async function (next) {
  this.supplierCode =
    "M" +
    generateUniqueId({
      length: 4,
      useLetters: false,
    });
  next();
});

supplierSchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Supplier",
    targetModel: "Supplier",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

supplierSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const supplierId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!supplierId) return next();

  const beforeUpdate = await this.model.findById(supplierId).lean();
  if (!beforeUpdate) return next(); // If supplier doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update supplier",
      targetModel: "Supplier",
      targetId: supplierId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging supplier update:", error);
  }

  next();
});

supplierSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Supplier",
      targetModel: "Supplier",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

export const supplierModel = mongoose.model("supplier", supplierSchema);
