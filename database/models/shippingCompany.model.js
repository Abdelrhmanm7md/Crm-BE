import generateUniqueId from "generate-unique-id";
import mongoose from "mongoose";
import { logModel } from "./log.model.js";
import { orderModel } from "./order.model.js";

const shippingCompanySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      // minLength: [2, "too short shipping Company name"],
    },
    addresses: [
      {
        address: { type: String, required: true },
      },
    ],
    company: {
      type: String,
      // required: [true, "Company is a required field."],
    },
    postCode: {
      type: String,
      // required: [true, "postCode is a required field."],
    },
    email: {
      type: String,
      required: [true, "Phone is a required field."],
      default: null,
    },
    governorate: {
      type: String,
      required: [true, "Governorate is a required field."],
    },
    country: {
      type: String,
      required: [true, "Country is a required field."],
    },
    shippingCompanyCode: {
      type: String,
      uniqe: true,
      // required: true,
    },
    ordersCount: {
      type: Number,
      // required: true,
    },
    priceList: {
      type: [
        {
          name: {
            type: String,
            // required: true,
          },
          price: {
            type: String,
            // required: true,
          },
        },
      ],
    },
    phone: {
      type: String,
    },
    collectionDoneAmount: [
      {
        date:{
          type:Date,
        },
        amount:{
          type:Number,
        }
    }],
    collectionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    ordersCount: {
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

shippingCompanySchema.pre("save", async function (next) {
  this.shippingCompanyCode =
    "S" +
    generateUniqueId({
      length: 4,
      useLetters: false,
    });
  let check = await shippingCompanyModel.findOne({ phone: this.phone });
  const queryData = this.$locals.queryData;
  let err_1 = "this phone number is already registered.";
  if (queryData?.lang == "ar") {
    err_1 = "هذا رقم الهاتف مسجل بالفعل";
  }
  if (check) {
    throw new Error(err_1);
  }
  next();
});
shippingCompanySchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Shipping Company",
    targetModel: "Shipping Company",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

shippingCompanySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const shippingCompanyId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!shippingCompanyId) return next();

  const beforeUpdate = await this.model.findById(shippingCompanyId).lean();
  if (!beforeUpdate) return next(); // If shippingCompany doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update shippingCompany",
      targetModel: "shippingCompany",
      targetId: shippingCompanyId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging shippingCompany update:", error);
  }

  next();
});

shippingCompanySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete shippingCompany",
      targetModel: "shippingCompany",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

shippingCompanySchema.post("find", async function (docs) {
  if (!docs.length) return;

  const shippingCompanyIds = docs.map((doc) => doc._id);

  const orderStats = await orderModel.aggregate([
    { 
      $match: { shippingCompany: { $in: shippingCompanyIds } } 
    },
    {
      $group: {
        _id: "$shippingCompany",
        totalOrders: { $sum: 1 },
        shippingOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "shipping"] }, 1, 0] },
        },
        totalAmount: {
          $sum: {
            $cond: [
              { $in: ["$orderStatus", ["shipping", "completed"]] },
              { $subtract: ["$realTotalAmount", "$realShippingPrice"] }, 
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: "orders",  // Ensure "orders" is the correct MongoDB collection name
        let: { shippingCompanyId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$shippingCompany", "$$shippingCompanyId"] } } },
          { $match: { orderStatus: "shipping" } }, // Only get orders with status "shipping"
          { $project: { _id: 1, orderStatus: 1, realTotalAmount: 1 } } // Select only needed fields
        ],
        as: "orders"
      }
    }
  ]);

  // Attach results to `docs`
  const statsMap = new Map();
  orderStats.forEach((stat) => {
    statsMap.set(stat._id.toString(), stat);
  });

  docs.forEach((doc) => {
    const stat = statsMap.get(doc._id.toString());
    doc.ordersCount = stat?.shippingOrders || 0;
    doc.collectionAmount = stat?.totalAmount || 0;
    doc.totalOrdersCount = stat?.totalOrders || 0;
    doc.orders = stat?.orders || [];  // Assign orders directly

    let amount = 0;
    if (Array.isArray(doc.collectionDoneAmount)) {
        doc.collectionDoneAmount.forEach((item) => {
            amount += item.amount;
        });
    }
    doc.collectionAmount -= amount;
  });
});

export const shippingCompanyModel = mongoose.model(
  "shippingCompany",
  shippingCompanySchema
);
