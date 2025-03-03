import generateUniqueId from "generate-unique-id";
import mongoose from "mongoose";
import { logModel } from "./log.model.js";
import { couponModel } from "./coupon.model.js";

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
      required: true,  // before apply coupon
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
        "checkout-draft"
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
    shippingPrice: {
      type: Number,
      default:0,
      required: true,
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

// orderSchema.pre("save", async function (next) {
//   const Product = mongoose.model("product");
//   try {
//     for (const item of this.products) {
//       const queryData = this.$locals.queryData;
//       let err_1 = `Product with ID ${item.product} not found.`;
//       let err_2 = `Branch ${this.branch} not found for product: ${product.name}`
//       let err_3 = `Insufficient quantity for product: ${product.name}`
//       console.log(queryData,"queryData2");

//       if (queryData?.lang == "ar") {
//         err_1 = `هذا الصنف غير موجود${item.product}!`;
//         err_2 = `هناك مخزون (ات) غير موجود`;
//         err_3 = `لا يوجد كمية كافية للمنتج: ${product.name}`
//       }
//       const product = await Product.findById(item.product);
//       if (!product) {
//         throw new Error(`${err_1}`);
//       }

//       const storeItem = product.store.find(
//         (store) => String(store.branch._id) === String(this.branch)
//       );

//       if (!storeItem) {
//         throw new Error(
//           `${err_2}`
//         );
//       }

//       if (storeItem.quantity < item.quantity) {
//         throw new Error(`${err_3}`);
//       }

//     }

//     next();
//   } catch (error) {
//     next(error);
//   }
// });

orderSchema.pre("save", async function (next) {
  
  let totalPrice = this.products.reduce((acc, product) => {
    return acc + product.price * product.quantity;
  }, 0);
  this.totalAmountBeforeDiscount = totalPrice
  this.totalAmount = totalPrice + this.shippingPrice

  let check = await couponModel.findOne({ _id: this.coupon });
  
  if(check && check.isValid == true){
    if(check.freeShipping == true){
      this.shippingPrice = 0
    }
    switch (check.type) {
      case "both":
        this.totalAmount =  ((totalPrice + this.shippingPrice) * (check.discountPercentage / 100))
        break;
        case "product":
          this.totalAmount = ((totalPrice) * (check.discountPercentage / 100)) + this.shippingPrice
          break;
          case "shipping":
        this.totalAmount = totalPrice + (( this.shippingPrice) * (check.discountPercentage / 100))
        break;
      }
  }
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

orderSchema.pre("findOneAndUpdate", async function () {
  if (this._update.products || this._update.orderStatus === "processing") {

  let totalPrice = this._update.products.reduce((acc, product) => {
    return acc + product.price * product.quantity;
  }, 0);
  this._update.totalAmountBeforeDiscount = totalPrice
  this._update.totalAmount = totalPrice + this._update.shippingPrice
  let check = await couponModel.findById(this._update.coupon);
  if(check && check.isValid == true && (this._update.orderStatus === "processing") ){
    if(check.freeShipping == true){
      this._update.shippingPrice = 0
    }
    switch (check.type) {
      case "both":
        this._update.totalAmount =  ((totalPrice + this._update.shippingPrice) * (check.discountPercentage / 100))
        break;
        case "product":
          this._update.totalAmount =  ((totalPrice) * (check.discountPercentage / 100)) + this._update.shippingPrice
          break;
          case "shipping":
            this._update.totalAmount = totalPrice + (( this._update.shippingPrice) * (check.discountPercentage / 100))
        break;
      }
  }
  await orderModel.findByIdAndUpdate(
    this._update._id,
    { totalAmount: this._update.totalAmount },
    {new:true,userId: this.options.userId,}
  );
}
});

orderSchema.pre("findOneAndUpdate", async function (next) {
  const Product = mongoose.model("product");
  
  // Use this.getQuery() to access the query
  const queryData = this.getQuery();
  const update = this.getUpdate();
  const { products, branch, orderStatus } = update;
  
  if (!products || !branch || !orderStatus) {
    return next();
  }

  try {
    for (const item of products) {
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

      const storeItem = product.store.find(
        (store) => String(store.branch._id) === String(branch)
      );
      if (!storeItem) {
        throw new Error(err_2);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});


orderSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (!update.orderStatus) return next(); // Skip if orderStatus is not updated

  const order = await this.model.findOne(this.getQuery()).lean();
  if (!order) return next();

  const wasAlreadyProcessed = ["shipping", "completed"].includes(order.orderStatus);
  const willProcessNow = ["shipping", "completed"].includes(update.orderStatus);

  if (!wasAlreadyProcessed && willProcessNow) {
    for (const item of order.products) {
      const product = await mongoose.model("product").findById(item.productId);
      if (product) {
        product.store.forEach(storeItem => {
          if (storeItem.branch.toString() === item.branchId.toString()) {
            if (storeItem.quantity >= item.quantity) {
              storeItem.quantity -= item.quantity;
            } else {
              throw new Error(`Not enough stock for product ${product.name}`);
            }
          }
        });
              await product.updateOne(
        { _id: item.product, "store.branch": this.branch },
        { $inc: { "store.$.quantity": -item.quantity } },
        { userId: this.options.userId }
      );
      }
    }
  }

  next();
});

orderSchema.pre(/^find/, function () {
  this.populate({ path: "products.product" });
  this.populate("supplier");
  this.populate("shippingCompany");
  this.populate("branch");
});
export const orderModel = mongoose.model("order", orderSchema);
