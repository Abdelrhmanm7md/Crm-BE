import mongoose from "mongoose";

const sizeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is a required field."],
    },
  },
  { timestamps: true }
);

export const sizeModel = mongoose.model("size", sizeSchema);
