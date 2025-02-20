import mongoose from "mongoose";
import { logModel } from "./log.model.js";

const couponSchema = mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      required: [true, "coupon code required"],
      unique: true,
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
      required: [true, "coupon discount required"],
    },
    discountPercentage: {
      type: Number,
      min: 0,
      default: 0,
      required: [true, "coupon discount required"],
    },
    expires: {
      type: Date,
      required: [true, "coupon date required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

couponSchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Coupon",
    targetModel: "Coupon",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

couponSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const couponId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!couponId) return next();

  const beforeUpdate = await this.model.findById(couponId).lean();
  if (!beforeUpdate) return next(); // If coupon doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update coupon",
      targetModel: "Supplier",
      targetId: couponId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging coupon update:", error);
  }

  next();
});

couponSchema.pre(
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

export const couponModel = mongoose.model("coupon", couponSchema);
