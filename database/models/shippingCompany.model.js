import generateUniqueId from "generate-unique-id";
import mongoose from "mongoose";
import { logModel } from "./log.model.js";
import { orderModel } from "./order.model.js";

const shippingCompanySchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    addresses: [{ address: { type: String, required: true } }],
    company: { type: String },
    postCode: { type: String },
    email: { type: String, required: [true, "Email is required"], default: null },
    governorate: { type: String, required: [true, "Governorate is required"] },
    country: { type: String, required: [true, "Country is required"] },
    shippingCompanyCode: { type: String, unique: true },
    phone: { type: String },
    priceList: [
      {
        name: { type: String },
        price: { type: String },
      },
    ],
    collectionDoneAmount: [
      {
        date: { type: Date },
        amount: { type: Number },
      },
    ],
    collectionAmount: { type: Number, required: true, default: 0 },
    ordersCount: { type: Number, required: true, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

// ✅ Pre-save: Generate Unique Code and Validate Phone Number
shippingCompanySchema.pre("save", async function (next) {
  this.shippingCompanyCode =
    "S" + generateUniqueId({ length: 4, useLetters: false });

  let check = await shippingCompanyModel.findOne({ phone: this.phone });
  if (check) {
    throw new Error("This phone number is already registered.");
  }
  next();
});

// ✅ Pre-save: Log Creation
shippingCompanySchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy,
    action: "create Shipping Company",
    targetModel: "Shipping Company",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

// ✅ Pre-update: Log Updates
shippingCompanySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const shippingCompanyId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId;

  if (!shippingCompanyId) return next();

  const beforeUpdate = await this.model.findById(shippingCompanyId).lean();
  if (!beforeUpdate) return next();

  try {
    await logModel.create({
      user: actionBy,
      action: "update shippingCompany",
      targetModel: "shippingCompany",
      targetId: shippingCompanyId,
      before: beforeUpdate,
      after: update,
    });
  } catch (error) {
    console.error("Error logging shippingCompany update:", error);
  }

  next();
});

// ✅ Pre-delete: Log Deletions
shippingCompanySchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  const actionBy = this.userId;

  await logModel.create({
    user: actionBy,
    action: "delete shippingCompany",
    targetModel: "shippingCompany",
    targetId: this._id,
    before: this.toObject(),
  });

  next();
});

shippingCompanySchema.post("find", async function (docs) {
  if (!docs.length) return;

  const shippingCompanyIds = docs.map((doc) => doc._id);
  console.log("📌 Shipping Company IDs:", shippingCompanyIds);

  const orderStats = await orderModel.aggregate([
    { 
      $match: { shippingCompany: { $in: shippingCompanyIds } } 
    },
    {
      $group: {
        _id: "$shippingCompany",
        totalOrders: { $sum: 1 },
        shippingOrders: { $sum: { $cond: [{ $eq: ["$orderStatus", "shipping"] }, 1, 0] } },
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
    }
  ]);
  
  console.log("🚀 Order Stats:", JSON.stringify(orderStats, null, 2));

  const ordersByCompany = await orderModel
    .find({ shippingCompany: { $in: shippingCompanyIds }, orderStatus: "shipping" })
    .select("_id orderStatus realTotalAmount realShippingPrice shippingCompany")
    .exec();

  console.log("🛒 Orders Found:", JSON.stringify(ordersByCompany, null, 2));

  const ordersMap = new Map();
  ordersByCompany.forEach(order => {
    if (!ordersMap.has(order.shippingCompany.toString())) {
      ordersMap.set(order.shippingCompany.toString(), []);
    }
    ordersMap.get(order.shippingCompany.toString()).push(order);
  });

  const statsMap = new Map();
  orderStats.forEach((stat) => {
    statsMap.set(stat._id.toString(), stat);
  });

  for (const doc of docs) {
    const stat = statsMap.get(doc._id.toString());

    doc.set("ordersCount", stat?.shippingOrders || 0);
    doc.set("collectionAmount", stat?.totalAmount || 0);
    doc.set("totalOrdersCount", stat?.totalOrders || 0);
    doc.set("orders", ordersMap.get(doc._id.toString()) || []);

    let amount = 0;
    if (Array.isArray(doc.collectionDoneAmount)) {
      doc.collectionDoneAmount.forEach((item) => {
        amount += item.amount;
      });
    }
    doc.set("collectionAmount", doc.collectionAmount - amount);
  }
});
  
export const shippingCompanyModel = mongoose.model("shippingCompany", shippingCompanySchema);
