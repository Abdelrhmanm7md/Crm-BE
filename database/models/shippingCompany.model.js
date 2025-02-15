import generateUniqueId from "generate-unique-id";
import mongoose from "mongoose";

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
export const shippingCompanyModel = mongoose.model(
  "shippingCompany",
  shippingCompanySchema
);
