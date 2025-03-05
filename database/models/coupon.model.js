import mongoose from "mongoose";
import { logModel } from "./log.model.js";

const couponSchema = mongoose.Schema(
  {
    wordPressId: { type: String,}, // To prevent duplicates
    code: {
      type: String,
      trim: true,
      required: [true, "coupon code required"],
      unique: true,
    },
    discountType: {
      type: String,
      enum: ["percent", "fixed_product"],
      required: [true, "coupon type required"],
    },
    amount: {
      type: Number,
      required: true,
    }, // Percentage or fixed
    usageLimit: { type: Number, required: true }, // How many times can be used
    usageLimitPerUser: { type: Number, required: true }, // Max number of times per user
    freeShipping: { type: Boolean, desfault: false, required: true }, // Free shipping enabled
    expires: { type: Date }, // Expiry date
    excludeSaleItems: { type: Boolean, required: true }, // Cannot be used on sale items
    minimumAmount: { type: Number, required: true }, // Minimum cart value of $50
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

couponSchema.pre("save", async function (next) {
  if (this.expires && this.expires < new Date() && this.expires != null) {
    this.isValid = false;
  }
  let check = await couponModel.findOne({ code: this.code });
  const queryData = this.$locals.queryData;
  let err_1 = "code is already taken";
  if (queryData?.lang == "ar") {
    err_1 = "الكود مأخوذ بالفعل";
  }
  if (check) {
    return next(new Error(err_1));
  }
  next();
});

couponSchema.pre(["find", "findOne"], async function (next) {
  const now = new Date();

  await this.model.updateMany({ expires: { $lt: now } }, { isValid: false });

  next();
});

couponSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.expires && new Date(update.expires) < new Date()) {
    update.isValid = false;
  }
  next();
});

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
