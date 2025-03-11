import generateUniqueId from "generate-unique-id";
import mongoose from "mongoose";
import { logModel } from "./log.model.js";
import AppError from "../../src/utils/appError.js";

const orderSchema = mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      default: " ",
    },
    SKU: {
      type: String,
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supplier",
      // required: true,
    },
    shippingCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shippingCompany",
      // required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customer",
      required: true,
    },
    customerNotes: {
      type: String,
      // required: true,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon",
      default: null,
      // required: true,
    },
    address: {
      type: String,
      required: true,
    },
    governorate: {
      type: String,
      required: true,
    },
    totalAmountBeforeDiscount: {
      type: Number,
      default: 0,
      required: true, // before apply coupon
    },
    totalAmount: {
      type: Number,
      // required: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "shipping",
        "auto-draft",
        "pending",
        "processing",
        "on-hold",
        "completed",
        "cancelled",
        "refunded",
        "failed",
        "checkout-draft",
      ],
      default: "processing",
      required: true,
    },
    productVariations: {
      type: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            // required: true,
          },
          price: {
            type: Number,
            required: true,
          },
          quantity: {
            type: Number,
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
        },
      ],
      default: [],
    },
    shippingPrice: {
      type: Number,
      default: 0,
      required: true,
    },
    fromWordPress: {
      type: Boolean,
      default: false,
    },
    stockReduced: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  let check = await orderModel.findOne({ orderNumber: this.orderNumber });
  let check2 = await orderModel.findOne({ SKU: this.SKU });
  const queryData = this.$locals.queryData;
  let err_1 = "Order Number already exists";
  let err_2 = "SKU is already taken";
  if (queryData?.lang == "ar") {
    err_1 = "رقم الطلب موجود بالفعل";
    err_2 = "SKU مأخوذ بالفعل";
  }
  if (check) {
    return next(new Error(err_1));
  }
  if (check2) {
    return next(new Error(err_2));
  }
  if (this.orderNumber == " ")
    this.orderNumber =
      "#" +
      generateUniqueId({
        length: 4,
        useLetters: false,
      });
  next();
});

orderSchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy,
    action: "create Order",
    targetModel: "Order",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

orderSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const orderId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options?.userId; // ✅ Get userId from query options

  if (!orderId) return next();

  const beforeUpdate = await this.model.findById(orderId).lean();
  if (!beforeUpdate) return next(); // If order doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update order",
      targetModel: "Order",
      targetId: orderId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging order update:", error);
  }

  next();
});

orderSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Order",
      targetModel: "Order",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

orderSchema.pre("findOneAndUpdate", async function (next) {
  const Product = mongoose.model("product");

  // Use this.getQuery() to access the query
  const queryData = this.getQuery();
  const update = this.getUpdate();
  const { productVariations, branch, orderStatus } = update;

  if (!productVariations || !branch || !orderStatus) {
    return next();
  }

  try {
    for (const item of productVariations) {
      let err_1 = `Product with ID ${item.product} not found.`;
      let err_2 = `Branch ${branch} not found for product.`;
      let err_3 = `Insufficient quantity for product.`;

      if (queryData?.lang === "ar") {
        err_1 = `هذا الصنف غير موجود ${item.product}!`;
        err_2 = `هناك مخزون (ات) غير موجود`;
        err_3 = `لا يوجد كمية كافية للمنتج`;
      }

      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(err_1);
      }

      const storeItem = product.productVariations.find((variation) =>
        variation.branch.some((b) => String(b) === String(branch))
      );
      if (!storeItem && product.fromWordPress == false) {
        throw new Error(err_2);
      }

      if (
        storeItem?.quantity < item.quantity &&
        product.fromWordPress == false
      ) {
        throw new Error(err_3);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

orderSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate();
    if (!update.orderStatus) return next(); // Skip if orderStatus is not updated

    const order = await this.model.findOne(this.getQuery()).lean();
    if (!order) return next();

    const wasAlreadyProcessed = ["shipping"].includes(order.orderStatus);
    const willProcessNow = ["shipping"].includes(update.orderStatus);

    if (!wasAlreadyProcessed && willProcessNow && order.fromWordPress == false) {
      const Product = mongoose.model("product");

      for (const variation of order.productVariations) {
        const product = await Product.findById(variation.product);
        if (!product) continue; // Skip this iteration if product is not found

        await Product.findOneAndUpdate(
          {
            _id: variation.product,
            productVariations: {
              $elemMatch: {
                color: variation.color,
                size: { $in: variation.size },
                branch: variation.branch, // Matches if branch list contains variation.branch
              },
            },
          },
          {
            $inc: { "productVariations.$.quantity": -variation.quantity },
          },
          {
            new: true,
            userId: this.options.userId,
          }
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

orderSchema.pre(/^find/, function () {
  this.populate("supplier");
  this.populate("shippingCompany");
  this.populate("branch");
});
export const orderModel = mongoose.model("order", orderSchema);
