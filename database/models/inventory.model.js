import mongoose from "mongoose";

const inventorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "user",
    //   required: true,
    // },
  },
  { timestamps: true }
);

export const inventoryModel = mongoose.model(
  "inventory",
  inventorySchema
);
