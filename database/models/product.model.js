import mongoose from "mongoose";
import { branchModel } from "./branch.model.js";
import { logModel } from "./log.model.js";

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    wordPressId: {
      type: String,
      default: null,
    },
    SKU: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      // required: true,
    },
    description: {
      type: String,
      // required: true,
    },
    brand: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "brand",
      }
    ],
    category: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "category",
      // required: true,
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
      default:null,
      // required: true,
    },
    totalQuantity: {
      type: Number,
      default:0,
      // required: true,
    },
    costPrice: {
      type: Number,
      default:null,
      required: true,
    },
    salePrice: {
      type: Number,
      default:null,
    },
    sellingPrice: {
      type: Number,
      default:null,
      required: true,
    },
    productVariations:
    [
      {
        costPrice: {
          type: Number,
          default:null,
          // required: true,
        },
        regularPrice: {
          type: Number,
          default:null,
          // required: true,
        },
        salePrice: {
          type: Number,
          default:null,
          // required: true,
        },
        quantity: {
          type: Number,
          // required: true,
        },
        photo: {
          type: String,
          // required: true,
        },
        color: {
          type: String,
          // required: true,
        },
        size: {
          type: [String],
          // required: true,
        },
        weight:{
          type: String,
          // required: true,
        },
        dimensions: {
          length: { type: String,  },
          width: { type: String,  },
          height: { type: String, },
        },
        branch: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "branch",
          required: true,
        },
      },
    ],
    fromWordPress: {
      type: Boolean,
      default: false,
    },
    supplierOrderAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      // required: true,
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
    // const branchIds = this.store.map((item) => item.branch);

    // const existingInventories = await branchModel
    //   .find({
    //     _id: { $in: branchIds },
    //   })
    //   .select("_id");

    // const existingIds = existingInventories.map((inv) => inv._id.toString());
    // const missingIds = branchIds
    //   .map((id) => id.toString())
    //   .filter((id) => !existingIds.includes(id));

    // if (missingIds.length > 0 && check.fromWordPress == false) {
    //   return next(new Error(`${err_1}: ${missingIds.join(", ")}`));
    // }

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
  const actionBy = this.options.userId; 

  if (!productId) return next();

  const beforeUpdate = await this.model.findById(productId).lean();
  if (!beforeUpdate) return next(); 

  try {
    await logModel.create({
      user: actionBy, 
      action: "update product",
      targetModel: "Product",
      targetId: productId,
      before: beforeUpdate,
      after: update, 
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

productSchema.post("find", function (docs) {
  docs.forEach((doc) => {
    if (doc.productVariations?.length > 0) {
      doc.totalQuantity = doc.productVariations.reduce((sum, variation) => sum + (variation.quantity || 0), 0);
    } else {
      doc.totalQuantity = doc.store?.reduce((sum, storeItem) => sum + (storeItem.quantity || 0), 0);
    }
  });
});
productSchema.pre(/^find/, function () {
  this.populate({"path":"store.branch"});
  this.populate("supplier");
  this.populate("brand");
  this.populate("category");
})
export const productModel = mongoose.model("product", productSchema);
