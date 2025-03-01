import mongoose from "mongoose";
import { productModel } from "./product.model.js";
import { logModel } from "./log.model.js";

const brandSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: [true, "name is required"],
      required: true,
      minLength: [2, "too short brand name"],
    },
    slug: {
      type: String,
      unique: [true, "name is required"],
      // required: true,
      minLength: [2, "too short category name"],
    },
    SKU: {
      type: String,
      required: true,
    },
    categorys: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "category",
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

brandSchema.pre("save", async function (next) {
  let check = await brandModel.findOne({ SKU: this.SKU });
  const queryData = this.$locals.queryData;
  let err_2 = "SKU is already taken";
  if (queryData?.lang == "ar") {
    err_2 = "SKU مأخوذ بالفعل";
  }
  if (check) {
    return next(new Error(err_2));
  }
  next();
});

brandSchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy,
    action: "create Brand",
    targetModel: "Brand",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

brandSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const brandId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!brandId) return next();

  const beforeUpdate = await this.model.findById(brandId).lean();
  if (!beforeUpdate) return next(); // If brand doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update brand",
      targetModel: "Brand",
      targetId: brandId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging brand update:", error);
  }

  next();
});

brandSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Brand",
      targetModel: "Brand",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

brandSchema.post("find", async function (docs) {
  for (const doc of docs) {
    const [result] = await productModel.aggregate([
      { $match: { brand: doc._id } },
      {
        $group: {
          _id: "$brand",
          productsCount: { $sum: 1 },
          productsCost: { $sum: "$costPrice" },
          totalSellingPrice: { $sum: "$sellingPrice" },
        },
      },
      {
        $addFields: {
          productsGain: { $subtract: ["$totalSellingPrice", "$productsCost"] },
        },
      },
    ]);

    // Prepare update fields
    const updateFields = {
      productsCount: result?.productsCount || 0,
      productsCost: result?.productsCost || 0,
      productsGain: result?.productsGain || 0,
    };

    // Update the document efficiently
    await brandModel.updateOne({ _id: doc._id }, { $set: updateFields },{new:true,userId: this.options.userId,});
  }
});

brandSchema.pre(/^find/, function () {
  this.populate("categorys");
  this.populate("suppliers");
});

export const brandModel = mongoose.model("brand", brandSchema);
