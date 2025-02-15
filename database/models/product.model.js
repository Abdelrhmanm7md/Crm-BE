import mongoose from "mongoose";
import { inventoryModel } from "./inventory.model.js";

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brand",
      required: true,
    },
    colors: {
      type: [String],
    },
    pic: {
      type: String,
      default: undefined,
    },
    gallery: {
      type: [String],
      default: [],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      // required: true,
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
    suppliers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "supplier",
        required: true,
      },
    ],
    costPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    discountPercentage: {
      type: String,
      required: true,
      default: 0,
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


    const existingInventories = await inventoryModel
      .find({
        _id: { $in: inventoryIds },
      })
      .select("_id");

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

productSchema.pre(/^delete/, { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    doc.pic && removeFile("products", doc.pic);
    if (Array.isArray(doc.gallery) && doc.gallery.length > 0) {
      doc.gallery.forEach((file) => {
        removeFile("products", file);
      });
    } 
  }
});
export const productModel = mongoose.model("product", productSchema);
