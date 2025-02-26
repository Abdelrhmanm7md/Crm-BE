import mongoose from "mongoose";
import { logModel } from "./log.model.js";

const customerSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is a required field."],
    },
    addresses: [
      {
        address: { type: String, required: true },
      },
    ],
    phone: {
      type: String,
      // required: [true, "Phone is a required field."],
      // unique: [true, "this phone number is already registered."],
    },
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
      // required: [true, "Phone is a required field."],
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

customerSchema.pre("save", async function () {
  let check = await customerModel.findOne({ phone: this.phone });
  const queryData = this.$locals.queryData;
  let err_1 = "this phone number is already registered.";
  if (queryData?.lang == "ar") {
    err_1 = "هذا رقم الهاتف مسجل بالفعل";
  }
  if (check) {
    throw new Error(err_1);
  }
});

customerSchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Customer",
    targetModel: "Customer",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

customerSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const customerId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!customerId) return next();

  const beforeUpdate = await this.model.findById(customerId).lean();
  if (!beforeUpdate) return next(); // If customer doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update customer",
      targetModel: "Customer",
      targetId: customerId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging customer update:", error);
  }

  next();
});

customerSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Customer",
      targetModel: "Customer",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

export const customerModel = mongoose.model("customer", customerSchema);
