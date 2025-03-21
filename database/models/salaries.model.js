import mongoose from "mongoose";
import { logModel } from "./log.model.js";

const salarySchema = mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    salary: {
      type: Number,
      min : 0,
      required: [true, "salary is a required field."],
    },
    timeTable:[
      {
        date:{
          type:Date,
        },
        isPaid:{
          type:Boolean,
          default:false
        }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);
salarySchema.pre("save", async function (next) {
  let check = await salaryModel.findOne({ phone: this.phone });
  const queryData = this.$locals.queryData;
  let err = "Phone number for this user already exists";
  if (queryData?.lang == "ar") {
    err = "رقم الهاتف مسجل بالفعل";}
  if (check) {
    return next(new Error(err));
  }
  next();
});

salarySchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create Salary",
    targetModel: "Salary",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

salarySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const salaryId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!salaryId) return next();

  const beforeUpdate = await this.model.findById(salaryId).lean();
  if (!beforeUpdate) return next(); // If salary doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update salary",
      targetModel: "Salary",
      targetId: salaryId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging salary update:", error);
  }

  next();
});

salarySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete Salary",
      targetModel: "Salary",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

salarySchema.pre(/^find/, function () {
  this.populate("user");
});
export const salaryModel = mongoose.model("salary", salarySchema);
