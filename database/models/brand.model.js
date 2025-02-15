import mongoose from "mongoose";

const brandSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: [true, "name is required"],
      required: true,
      minLength: [2, "too short brand name"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    suppliers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "supplier",
        required: true,
      },
    ],
  },
  { timestamps: true }
);


export const brandModel = mongoose.model("brand", brandSchema);
