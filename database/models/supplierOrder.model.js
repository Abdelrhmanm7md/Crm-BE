import mongoose from "mongoose";
import { logModel } from "./log.model.js";
import { supplierModel } from "./supplier.model.js";
import * as dotenv from "dotenv";
dotenv.config();
const supplierOrderSchema = mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supplier",
      required: true,
    },
    productsCount: {
      type: Number,
      min: 0,
      required: [true, "products Count is a required field."],
    },
    totalAmount: {
      type: Number,
      min: 0,
    },
    paidPayment: {
      type: Number,
      min: 0,
      // required: [true, "paid Payment is a required field."],
    },
    remainingPayment: {
      type: Number,
      min: 0,
      // required: [true, "remaining Payment is a required field."],
    },
    productVariations: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          // required: true,
        },
        quantity: {
          type: Number,
          // required: true,
        },
        costPrice: {
          type: Number,
          default: null,
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
        weight: {
          type: String,
          // required: true,
        },
        dimensions: {
          length: { type: String },
          width: { type: String },
          height: { type: String },
        },
        branch: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "branch",
          // required: true,
        },
      },
    ],
    notes: {
      type: String,
    },
    factoryName: {
      type: String,
      required: true,
    },
    timeTablePayment: [
      {
        date: {
          type: Date,
          required: true,
        },
        amount: {
          type: Number,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);
supplierOrderSchema.pre("save", async function (next) {
  let check = await supplierModel.findOne({ _id: this.supplier });
  const queryData = this.$locals.queryData;
  let err_1 = "paidPayment should be greater than 0";
  let err_2 = "Supplier not found";
  if (queryData?.lang == "ar") {
    err_1 = "المبلغ المدفوع يجب أن يكون أكبر من 0";
    err_2 = "المورد غير موجود";
  }
  if (this.paidPayment < 0) {
    return next(new Error(err_1));
  }
  if (!check) {
    return next(new Error(err_2));
  }
  // this.totalAmount = this.products.reduce((acc, product) => {
  //   return acc + product.price * product.quantity;
  // }, 0);
  this.timeTablePayment.forEach((payment) => {
    this.paidPayment += payment.amount;
  });
  this.remainingPayment = this.totalAmount - this.paidPayment;
  await logModel.create({
    user: this.createdBy,
    action: "create Order from Supplier || انشاء طلبية من المورد",
    targetModel: "supplierOrder",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

supplierOrderSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const supplierOrderId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!supplierOrderId) return next();

  const beforeUpdate = await this.model.findById(supplierOrderId).lean();
  if (!beforeUpdate) return next(); // If supplierOrder doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update supplier Order || تحديث طلبية من المورد",
      targetModel: "supplierOrder",
      targetId: supplierOrderId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging supplierOrder update:", error);
  }

  next();
});

supplierOrderSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete supplier Order || مسح طلبية من المورد",
      targetModel: "supplierOrder",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

export const supplierOrderModel = mongoose.model(
  "supplierOrder",
  supplierOrderSchema
);
