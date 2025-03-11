import mongoose from "mongoose";

const productTransferLogSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    fromBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
      required: true,
    },
    toBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    costPrice: Number,
    sellingPrice: Number,
    salePrice: Number,
    color: String,
    size: [String],
    weight: String,
    dimensions: {
      length: String,
      width: String,
      height: String,
    },
    transferredAt: {
      type: Date,
      default: Date.now,
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

productTransferLogSchema.pre(/^find/, function () { // ✅ Use function()
  this.populate("product", "name");
  this.populate("fromBranch", "name");
  this.populate("toBranch", "name");
  this.populate("transferredBy", "name");
});
export const productLogsModel = mongoose.model("productLog", productTransferLogSchema);
