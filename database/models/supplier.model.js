import generateUniqueId from "generate-unique-id";
import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

supplierSchema.pre("save", async function (next) {
  this.supplierCode = "M" + generateUniqueId({
    length: 4, 
    useLetters: false,
  });
  next();
});
export const supplierModel = mongoose.model("supplier", supplierSchema);
