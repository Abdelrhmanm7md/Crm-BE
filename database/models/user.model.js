import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { logModel } from "./log.model.js";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is a required field."],
      minLength: [2, "Name is too short."],
    },
    email: {
      type: String,
      trim: true,
      required: [true, "Email is a required field."],
      minLength: 6,
      unique: [true, "Email must be unique."],
    },
    phone: {
      type: String,
      required: [true, "Phone is a required field."],
      minLength: [9, "phone is too short."],
      unique: [true, "Phone must be unique."],
    },
    password: {
      type: String,
      required: [true, "Phone is a required field."],
      minLength: [8, "password is too short , min length 8."],
      unique: [true, "Password must be unique."],
    },
    otp: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
      // required:true
    },
    verificationCode: {
      type: String,
      // required:true
    },
    access: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    userType: {
      type: String,
      enum: ["storeAdmin", "admin", "operation", "financial"],
      default: "storeAdmin",
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("findOneAndUpdate", function () {
  if (this._update.password) {
    this._update.password = bcrypt.hashSync(
      this._update.password,
      Number(process.env.SALTED_VALUE)
    );
  }
});

userSchema.pre("save", async function (next) {
  await logModel.create({
    user: this._id, // assuming you have a createdBy field
    action: "create User",
    targetModel: "User",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const userId = this.getQuery()._id || this.getQuery().id; // Get the user ID from the query
  const update = this.getUpdate();

  if (!userId) return next();

  try {
    // Fetch the document before update
    const beforeUpdate = await this.model.findById(userId).lean();
    if (!beforeUpdate) return next(); // If user doesn't exist, skip logging

    await logModel.create({
      user: this.options.userId || userId, // Ensure the correct user ID is stored
      action: "update User",
      targetModel: "User",
      targetId: userId,
      before: beforeUpdate, // Full document before update
      after: update, // Stores only the changed fields
    });
  } catch (error) {
    console.error("Error logging user update:", error);
  }

  next();
});

userSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete User",
      targetModel: "User",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

// userSchema.pre(/^delete/, { document: false, query: true }, async function () {
//   const doc = await this.model.findOne(this.getFilter());
//   if (doc) {
//     doc.profilePic && removeFile("profilePic", doc.profilePic);

//   }
// });
// userSchema.pre(/^find/, function () {
// });
export const userModel = mongoose.model("user", userSchema);
