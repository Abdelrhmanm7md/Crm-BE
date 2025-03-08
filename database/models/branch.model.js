import mongoose from "mongoose";
import { orderModel } from "./order.model.js";
import { productModel } from "./product.model.js";
import { logModel } from "./log.model.js";

const branchSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: [true, "name is already taken"],
      required: true,
      minLength: [2, "too short branch name"],
    },
    SKU: {
      type: String,
      unique: [true, "SKU is already taken"],
      required: true,
    },
    productsCount: {
      type: Number,
      required: true,
      default: 0,
    },
    capital: {
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

branchSchema.pre("save", async function (next) {
  let check = await branchModel.findOne({ SKU: this.SKU });
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

branchSchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Branch",
    targetModel: "Branch",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

branchSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const branchId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!branchId) return next();

  const beforeUpdate = await this.model.findById(branchId).lean();
  if (!beforeUpdate) return next(); // If branch doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update branch",
      targetModel: "Branch",
      targetId: branchId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging branch update:", error);
  }

  next();
});

branchSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Branch",
      targetModel: "Branch",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);
branchSchema.post("find", async function (docs) {
  for (const doc of docs) {

    const [productResult] = await productModel.aggregate([
      { $match: { "store.branch": doc._id } }, // Match products under the branch
      { $group: { _id: "$store.branch", count: { $sum: 1 } } },
    ]);
    const [capital] = await productModel.aggregate([
      { $match: { "store.branch": doc._id } }, // Match products under the branch
      {
        $group: {
          _id: "$store.branch",
          totalPrice: {
            $sum: {
              $cond: {
                if: { $ne: ["$salePrice", null] }, // If salePrice is NOT null
                then: "$salePrice", // Sum salePrice
                else: "$sellingPrice" // Otherwise, sum sellingPrice
              }
            }
          }
        }
      }
    ]);
    

    const updateFields = {
      productsCount: productResult?.count || 0,
      capital: capital?.totalPrice || 0,
    };

    await branchModel.updateOne({ _id: doc._id }, { $set: updateFields },{new:true,userId: this.options.userId});
  }
});

export const branchModel = mongoose.model("branch", branchSchema);
