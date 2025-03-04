import mongoose from "mongoose";
import { logModel } from "./log.model.js";
import { productModel } from "./product.model.js";

const capitalSchema = mongoose.Schema(
  {
    reason: {
      type: String,
      required: [true, "Name is a required field."],
      minLength: [2, "Name is too short."],
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



capitalSchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Capital",
    targetModel: "Capital",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

capitalSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const capitalId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!capitalId) return next();

  const beforeUpdate = await this.model.findById(capitalId).lean();
  if (!beforeUpdate) return next(); // If capital doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update capital",
      targetModel: "Capital",
      targetId: capitalId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging capital update:", error);
  }

  next();
});

capitalSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Capital",
      targetModel: "Capital",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);


capitalSchema.post("find", async function (docs) {
  const amountResult = await productModel.aggregate([
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: {
            $cond: {
              if: { $gt: ["$salePrice", 0] }, // If salePrice exists and is > 0
              then: "$salePrice", // Use salePrice
              else: "$sellingPrice", // Otherwise, use sellingPrice
            },
          },
        },
      },
    },
  ]);
  const productsData = {
    reson : "Products",
    amount : amountResult[0]?.totalAmount
  }

  docs.push(productsData)
});

export const capitalModel = mongoose.model("capital", capitalSchema);
