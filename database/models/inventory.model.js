import mongoose from "mongoose";
import { productModel } from "./product.model.js";

const inventorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is a required field."],
    },
    products:{
      type: [mongoose.Schema.Types.ObjectId],
      ref: "product",
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

inventorySchema.post("find", async function (docs) {
  for (const doc of docs) {

    let products =  await productModel.find()

    const updateFields = {
      products: products
    };
    await inventoryModel.updateOne({ _id: doc._id }, { $set: updateFields },{new:true,userId: this.options.userId});
  }
});

export const inventoryModel = mongoose.model("inventory", inventorySchema);
