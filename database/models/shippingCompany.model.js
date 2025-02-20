import generateUniqueId from "generate-unique-id";
import mongoose from "mongoose";
import { logModel } from "./log.model.js";

const shippingCompanySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: [2, "too short shipping Company name"],
    },
    shippingCompanyCode: {
      type: String,
      uniqe: true,
      required: true,
      minLength: [2, "too short shipping Company name"],
    },
    ordersCount: {
      type: Number,
      // required: true,
    },
    priceList: {
      type: [
        {
          name: {
            type: String,
            required: true,
          },
          price: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
    },
    collectionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    expectedAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

shippingCompanySchema.pre("save", async function (next) {
  this.shippingCompanyCode =
    "S" +
    generateUniqueId({
      length: 4,
      useLetters: false,
    });
  next();
});
shippingCompanySchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Shipping Company",
    targetModel: "Shipping Company",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

shippingCompanySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const shippingCompanyId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!shippingCompanyId) return next();

  const beforeUpdate = await this.model.findById(shippingCompanyId).lean();
  if (!beforeUpdate) return next(); // If shippingCompany doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update shippingCompany",
      targetModel: "shippingCompany",
      targetId: shippingCompanyId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging shippingCompany update:", error);
  }

  next();
});

shippingCompanySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete shippingCompany",
      targetModel: "shippingCompany",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

export const shippingCompanyModel = mongoose.model(
  "shippingCompany",
  shippingCompanySchema
);
