import mongoose from "mongoose";

const orderSchema = mongoose.Schema(
  {
    orderNumber: {
      type: String,
      // unique: true,
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
    inventory:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "inventory",
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
  const Product = mongoose.model("product");

  try {
    for (const item of this.products) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product with ID ${item.product} not found.`);
      }

      // Find the matching inventory for this order
      const storeItem = product.store.find((store) => String(store.inventory._id) === String(this.inventory));

      if (!storeItem) {
        throw new Error(`Inventory ${this.inventory} not found for product: ${product.name}`);
      }

      // Check if there's enough quantity available
      if (storeItem.quantity < item.quantity) {
        throw new Error(`Insufficient quantity for product: ${product.name}`);
      }

      // Deduct the quantity using updateOne to bypass product schema hooks
      await Product.updateOne(
        { _id: item.product, "store.inventory": this.inventory },
        { $inc: { "store.$.quantity": -item.quantity } }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});


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

orderSchema.pre("findOneAndUpdate", async function (next) {
  const Product = mongoose.model("product");

  const update = this.getUpdate();
  const { products, inventory, orderStatus } = update;

  if (!products || !inventory || !orderStatus) {
    return next();
  }

  try {
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product with ID ${item.product} not found.`);
      }

      const storeItem = product.store.find((store) => String(store.inventory._id) === String(inventory));
      if (!storeItem) {
        throw new Error(`Inventory ${inventory} not found for product: ${product.name}`);
      }

      if (orderStatus === "canceled") {
        // Return the quantities to inventory
        await Product.updateOne(
          { _id: item.product, "store.inventory": inventory },
          { $inc: { "store.$.quantity": item.quantity } }
        );
      } else {
        // Deduct quantities if order is not canceled
        if (storeItem.quantity < item.quantity) {
          throw new Error(`Insufficient quantity for product: ${product.name}`);
        }
        await Product.updateOne(
          { _id: item.product, "store.inventory": inventory },
          { $inc: { "store.$.quantity": -item.quantity } }
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});


orderSchema.pre(/^find/, function () {
  this.populate({"path":"products.product"});
  this.populate("supplier");
  this.populate("shippingCompany");
  this.populate("product");
})
export const orderModel = mongoose.model("order", orderSchema);
