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
  const actionBy = this.options.userId;

  if (!categoryId) return next();

  const beforeUpdate = await this.model.findById(categoryId).lean();
  if (!beforeUpdate) return next();

  let proposedChanges = {};

  if (update.$set) {
    proposedChanges = { ...proposedChanges, ...update.$set };
  }

  if (update.$unset) {
    for (const key in update.$unset) {
      proposedChanges[key] = undefined;
    }
  }

  if (!update.$set && !update.$unset) {
    proposedChanges = { ...update };
  }

  // Deep compare two values (arrays, objects, primitives)
  const isEqual = (a, b) => {
    if (a === b) return true;

    if (typeof a !== typeof b) return false;

    if (typeof a === "object" && a && b) {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;

      return aKeys.every(key => isEqual(a[key], b[key]));
    }

    return false;
  };

  const hasChanges = Object.entries(proposedChanges).some(([key, newVal]) => {
    const oldVal = key.split('.').reduce((obj, part) => (obj ? obj[part] : undefined), beforeUpdate);
    return !isEqual(oldVal, newVal);
  });

  if (!hasChanges) return next(); // ✅ Skip logging if nothing changed

  try {
    await logModel.create({
      user: actionBy,
      action: "update category",
      targetModel: "Category",
      targetId: categoryId,
      before: beforeUpdate,
      after: proposedChanges,
    });
  } catch (error) {
    console.error("❌ Error logging category update:", error);
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
