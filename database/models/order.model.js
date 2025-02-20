import generateUniqueId from "generate-unique-id";
import mongoose from "mongoose";
import { logModel } from "./log.model.js";

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
      required: true,
    },
    shippingCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shippingCompany",
      required: true,
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
    address: {
      type: String,
      required: true,
    },
    governorate: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      // required: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "shipped",
        "canceled",
        "failed",
        "processing",
        "onHold",
        "completed",
        "refunded",
        "draft",
        "returned",
      ],
      default: "processing",
      required: true,
    },
    products: {
      type: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
        },
      ],
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
  const Product = mongoose.model("product");
  const queryData = this.$locals.queryData;
  let err_1 = `Product with ID ${item.product} not found.`;
  let err_2 = `Branch ${this.branch} not found for product: ${product.name}`
  let err_3 = `Insufficient quantity for product: ${product.name}`

  if (queryData?.lang == "ar") {
    err_1 = `لم يتم الحذف! غير موجود!`;
    err_2 = `هناك مخزون (ات) غير موجود`;
    err_3 = `لا يوجد كمية كافية للمنتج: ${product.name}`
  }
  try {
    for (const item of this.products) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`${err_1}`);
      }

      const storeItem = product.store.find(
        (store) => String(store.branch._id) === String(this.branch)
      );

      if (!storeItem) {
        throw new Error(
          `${err_2}`
        );
      }

      // Check if there's enough quantity available
      if (storeItem.quantity < item.quantity) {
        throw new Error(`${err_3}`);
      }

      // Deduct the quantity using updateOne to bypass product schema hooks
      await Product.updateOne(
        { _id: item.product, "store.branch": this.branch },
        { $inc: { "store.$.quantity": -item.quantity } }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

orderSchema.pre("save", async function (next) {
  this.totalAmount = this.products.reduce((acc, product) => {
    return acc + product.price * product.quantity;
  }, 0);
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
  const actionBy = this.options.userId; // ✅ Get userId from query options

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

orderSchema.pre("findOneAndUpdate", async function () {
  if (this._update.products) {
    this._update.totalAmount = this._update.products.reduce((acc, product) => {
      return acc + product.price * product.quantity;
    }, 0);
    await orderModel.findByIdAndUpdate(
      this._update._id,
      { totalAmount: this._update.totalAmount },
      { new: true }
    );
  }
});

orderSchema.pre("findOneAndUpdate", async function (next) {
  const Product = mongoose.model("product");

  const update = this.getUpdate();
  const { products, branch, orderStatus } = update;

  if (!products || !branch || !orderStatus) {
    return next();
  }

  try {
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product with ID ${item.product} not found.`);
      }

      const storeItem = product.store.find(
        (store) => String(store.branch._id) === String(branch)
      );
      if (!storeItem) {
        throw new Error(
          `Branch ${branch} not found for product: ${product.name}`
        );
      }

      if (
        orderStatus === "canceled" ||
        orderStatus === "failed" ||
        orderStatus === "returned"
      ) {
        // Return the quantities to branch
        await Product.updateOne(
          { _id: item.product, "store.branch": branch },
          { $inc: { "store.$.quantity": item.quantity } }
        );
      } else {
        // Deduct quantities if order is not canceled
        if (storeItem.quantity < item.quantity) {
          throw new Error(`Insufficient quantity for product: ${product.name}`);
        }
        await Product.updateOne(
          { _id: item.product, "store.branch": branch },
          { $inc: { "store.$.quantity": -item.quantity } }
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

orderSchema.pre(/^find/, function () {
  this.populate({ path: "products.product" });
  this.populate("order");
  this.populate("shippingCompany");
  this.populate("branch");
});
export const orderModel = mongoose.model("order", orderSchema);
