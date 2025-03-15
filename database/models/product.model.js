import mongoose from "mongoose";
import { logModel } from "./log.model.js";
import generateUniqueId from "generate-unique-id";

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
      default: " ",
      // required: true,
    },
    shortDescription: {
      type: String,
      // required: true,
    },
    description: {
      type: String,
      // required: true,
    },
    status: {
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
      type: [mongoose.Schema.Types.ObjectId],
      ref: "color",
      default: [],
    },
    size: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "size",
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
    productVariations:
    [
      {
        costPrice: {
          type: Number,
          default:null,
          // required: true,
        },
        sellingPrice: {
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
          // required: true,
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
  if (this.SKU == " "){
    this.SKU =
    generateUniqueId({
      length: 4,
      useLetters: false,
    });
  }
  next();
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

productSchema.post("find", async function (docs) {
  for (const doc of docs) {
    if (doc.productVariations?.length > 0) {
      doc.totalQuantity = doc.productVariations.reduce((sum, variation) => sum + (variation.quantity || 0), 0);
    }
  }
});

productSchema.pre(/^find/, function () {
  this.populate("supplier");
  this.populate("brand");
  this.populate("category");
  this.populate("colors")
  this.populate("size")
})
export const productModel = mongoose.model("product", productSchema);
