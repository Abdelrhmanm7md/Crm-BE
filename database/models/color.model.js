import mongoose from "mongoose";

const colorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is a required field."],
    },
  },
  { timestamps: true }
);

export const colorModel = mongoose.model("color", colorSchema);
