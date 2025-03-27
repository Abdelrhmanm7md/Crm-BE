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
    orders: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "order",
      default: [],
    },
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
  
    const orderStats = await orderModel.aggregate([
      { 
        $match: { 
          shippingCompany: { $in: shippingCompanyIds } 
        } 
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
  
    const statsMap = new Map();
    orderStats.forEach((stat) => {
      statsMap.set(stat._id.toString(), stat);
    });
  
    for (const doc of docs) {
      const stat = statsMap.get(doc._id.toString());
      const plainDoc = doc.toObject(); // Convert to plain JSON object
  
      plainDoc.ordersCount = stat?.shippingOrders || 0;
      plainDoc.collectionAmount = stat?.totalAmount || 0;
      plainDoc.totalOrdersCount = stat?.totalOrders || 0;
  
      // 🔥 Populate orders field
      plainDoc.orders = await orderModel
        .find({ shippingCompany: doc._id, orderStatus: "shipping" })
        .select("orderStatus realTotalAmount realShippingPrice") // Select only required fields
        .lean(); // Convert to plain objects
  
      let amount = 0;
      if (Array.isArray(plainDoc.collectionDoneAmount)) {
        plainDoc.collectionDoneAmount.forEach((item) => {
          amount += item.amount;
        });
      }
      plainDoc.collectionAmount -= amount;
  
      Object.assign(doc, plainDoc); // Merge changes back to Mongoose document
    }
  });
  

// ✅ Export Model
export const shippingCompanyModel = mongoose.model("shippingCompany", shippingCompanySchema);
