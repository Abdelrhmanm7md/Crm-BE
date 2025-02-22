import mongoose from "mongoose";
import { branchModel } from "./branch.model.js";
import { logModel } from "./log.model.js";

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    SKU: {
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
      default: [],
    },
    attributes: {
      type: [
        {
          name: {
            type: String,
            required: true,
          },
          value: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
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
      required: true,
    },
    store: [
      {
        branch: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "branch",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supplier",
      required: true,
    },
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

productSchema.pre("save", async function (next) {
  const queryData = this.$locals.queryData;
  let err_1 = "There are branch(s) that do not exist";
  let err_2 = "SKU is already taken";
  if (queryData?.lang == "ar") {
    err_1 = "هناك مخزون (ات) غير موجود";
    err_2 = "SKU مأخوذ بالفعل";
  }
  try {
    let check = await productModel.findOne({ SKU: this.SKU });
    if (check) {
      return next(new Error(`${err_2}`));
    }
    // Extract all branch IDs
    const branchIds = this.store.map((item) => item.branch);

    const existingInventories = await branchModel
      .find({
        _id: { $in: branchIds },
      })
      .select("_id");

    const existingIds = existingInventories.map((inv) => inv._id.toString());
    const missingIds = branchIds
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

productSchema.pre(
  /^delete/,
  { document: false, query: true },
  async function () {
    const doc = await this.model.findOne(this.getFilter());
    if (doc) {
      doc.pic && removeFile("products", doc.pic);
      if (Array.isArray(doc.gallery) && doc.gallery.length > 0) {
        doc.gallery.forEach((file) => {
          removeFile("products", file);
        });
      }
    }
  }
);

productSchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy,
    action: "create Product",
    targetModel: "Product",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const productId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!productId) return next();

  const beforeUpdate = await this.model.findById(productId).lean();
  if (!beforeUpdate) return next(); // If product doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update product",
      targetModel: "Product",
      targetId: productId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging product update:", error);
  }

  next();
});

productSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Product",
      targetModel: "Product",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

productSchema.pre(/^find/, function () {
  this.populate({"path":"store.branch"});
  this.populate("supplier");
  this.populate("brand");
  this.populate("category");
})
export const productModel = mongoose.model("product", productSchema);
