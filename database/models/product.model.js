import mongoose from "mongoose";
import { inventoryModel } from "./inventory.model.js";

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
    },
    store: [
      {
        inventory: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "inventory",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    unitPrice: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.pre("save", async function (next) {
  
  const queryData = this.$locals.queryData;
    let err_1 = "There are inventory(s) that do not exist";
  if (queryData?.lang == "ar") {
    err_1 = "هناك مخزون (ات) غير موجود";
  }
  try {
    // Extract all inventory IDs
    const inventoryIds = this.store.map((item) => item.inventory);

    // Check if all inventory IDs exist in the database
    const existingInventories = await inventoryModel.find({
      _id: { $in: inventoryIds },
    }).select("_id");

    const existingIds = existingInventories.map((inv) => inv._id.toString());
    const missingIds = inventoryIds
      .map((id) => id.toString())
      .filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0) {
      return next(new Error(`${err_1}: ${missingIds.join(", ")}`));
    }

    next();
  } catch (error) {
    next(error);
  }
});

export const productModel = mongoose.model("product", productSchema);
