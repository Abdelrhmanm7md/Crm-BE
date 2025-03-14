import mongoose from "mongoose";
import { productModel } from "./product.model.js";
import { logModel } from "./log.model.js";

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      // unique: [true, "name is required"],
      required: true,
    },
    wordPressId: {
      type: String,
      default: null,
    },
    slug: {
      type: String,
    },
    SKU: {
      type: String,
      // required: true,
    },
    suppliers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "supplier",
      // required: true,
    },
    productsCount: {
      type: Number,
      required: true,
      default: 0,
    },
    productsCost: {
      type: Number,
      required: true,
      default: 0,
    },
    productsGain: {
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

categorySchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Category",
    targetModel: "Category",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

categorySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const categoryId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!categoryId) return next();

  const beforeUpdate = await this.model.findById(categoryId).lean();
  if (!beforeUpdate) return next(); // If category doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update category",
      targetModel: "Category",
      targetId: categoryId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging category update:", error);
  }

  next();
});

categorySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Category",
      targetModel: "Category",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

categorySchema.post("find", async function (docs) {
  for (const doc of docs) {

     const [result] = await productModel.aggregate([
          { $match: { category: doc._id } }, // Match products under the given brand
          {
            $project: {
              costPrice: 1,
              sellingPrice: 1,
              variationsCostPrice: { $sum: "$productVariations.costPrice" },
              variationsSellingPrice: { $sum: "$productVariations.sellingPrice" },
            },
          },
          {
            $group: {
              _id: "$category",
              productsCount: { $sum: 1 },
              totalCostPrice: { $sum:  "$variationsCostPrice"  },
              totalSellingPrice: { $sum:  "$variationsSellingPrice"},
            },
          },
          {
            $addFields: {
              productsGain: { $subtract: ["$totalSellingPrice", "$totalCostPrice"] },
            },
          },
        ]);

    // Prepare update fields
    const updateFields = {
      productsCount: result?.productsCount || 0,
      productsCost: result?.productsCost || 0,
      productsGain: result?.productsGain || 0,
    };

    await categoryModel.updateOne({ _id: doc._id }, { $set: updateFields },{new:true,userId: this.options.userId});
  }
});

categorySchema.pre(/^find/, function () {
  this.populate("suppliers");
});

export const categoryModel = mongoose.model("category", categorySchema);
