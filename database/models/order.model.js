import mongoose from "mongoose";

const orderSchema = mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supplier",
      required: true,
    },
    shippingCompany:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "shippingCompany",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    governorate: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      // required: true,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "shipped", "delivered", "canceled", "returned","processing"],
      default: "pending",
      required: true,
    },
    products: {
      type:[{
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      }],
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  this.totalAmount = this.products.reduce((acc, product) => {
    return acc + product.price * product.quantity;
  }, 0);
  next();
});
orderSchema.pre("findOneAndUpdate", async function () {
  if (this._update.products) {
    this._update.totalAmount = this._update.products.reduce((acc, product) => {
      return acc + product.price * product.quantity;
    }, 0);
    await orderModel.findByIdAndUpdate(
      this._update._id ,
      { totalAmount: this._update.totalAmount },
      { new: true }
    );
  }
});
export const orderModel = mongoose.model("order", orderSchema);
