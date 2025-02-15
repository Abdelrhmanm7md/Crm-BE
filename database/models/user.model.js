import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { removeFile } from "../../src/utils/removeFiles.js";

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

// userSchema.post("init", (doc) => {
//   doc.profilePic = process.env.BASE_URL + "profilePic/" + doc.profilePic;
// });

userSchema.pre("save", function () {
  this.password = bcrypt.hashSync(this.password, Number(process.env.SALTED_VALUE));
});
userSchema.pre("findOneAndUpdate", function () {
  if (this._update.password) {
    this._update.password = bcrypt.hashSync(
      this._update.password,
      Number(process.env.SALTED_VALUE)
    );
  }
});

userSchema.pre(/^delete/, { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    doc.profilePic && removeFile("profilePic", doc.profilePic);

  }
});
// userSchema.pre(/^find/, function () {
// });
export const userModel = mongoose.model("user", userSchema);
