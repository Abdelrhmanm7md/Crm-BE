import { orderModel } from "../../../database/models/order.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import axios from "axios";
import cron from "node-cron";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { productModel } from "../../../database/models/product.model.js";
import { customerModel } from "../../../database/models/customer.model.js";
import { shippingCompanyModel } from "../../../database/models/shippingCompany.model.js";
import { couponModel } from "../../../database/models/coupon.model.js";
dotenv.config();

const createOrder = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  let newOrder = new orderModel(req.body);
  let addedOrder = await newOrder.save({ context: { query: req.query } });

  res.status(201).json({
    message: "Order has been created successfully!",
    addedOrder,
  });
});

const getAllOrder = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(orderModel.find(), req.query);
  // .pagination()
  // .filter()
  // .sort()
  // .search()
  // .fields();

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });
});
const exportOrder = catchAsync(async (req, res, next) => {
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    orderModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const getOrderById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let result = await orderModel.findById(id);
  let message_1 = "No Order was found!";
  if (req.query.lang == "ar") {
    message_1 = "لا يوجد طلبات!";
  }
  if (!result || result.length === 0) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: "Done", result });
});
const getAllOrdersByStatus = catchAsync(async (req, res, next) => {
  let { status } = req.params;

  let result = await orderModel.find({ orderStatus: status });
  let message_1 = "No Order was found!";
  if (req.query.lang == "ar") {
    message_1 = "لا يوجد طلبات!";
  }
  !result && res.status(404).json({ message: message_1 });

  res.status(200).json({ message: "Done", result });
});
const getAllOrdersByShippingCompany = catchAsync(async (req, res, next) => {
  let { shippingId } = req.params;

  let result = await orderModel.find({ shippingCompany: shippingId });
  let message_1 = "No Order was found!";
  if (req.query.lang == "ar") {
    message_1 = "لا يوجد طلبات!";
  }
  !result && res.status(404).json({ message: message_1 });

  res.status(200).json({ message: "Done", result });
});

const updateOrder = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedOrder = await orderModel.findByIdAndUpdate(id, req.body, {
    new: true,
    userId: req.userId,
    context: { query: req.query },
  });
  let message_1 = "Couldn't update!  not found!";
  let message_2 = "Order updated successfully!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر التحديث! غير موجود!";
    message_2 = "تم تحديث الطلب بنجاح!";
  }

  if (!updatedOrder) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: message_2, updatedOrder });
});
const deleteOrder = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  // Find the order first
  let order = await orderModel.findById(id);
  let message_1 = "Couldn't delete! Not found!";
  let message_2 = "Order deleted successfully!";
  if (req.query.lang == "ar") {
    message_1 = "لم يتم الحذف! غير موجود!";
    message_2 = "تم حذف الطلب بنجاح!";
  }
  if (!order) {
    return res.status(404).json({ message: message_1 });
  }

  // ✅ Attach orderId before deleting
  order.userId = req.userId;
  await order.deleteOne();

  res.status(200).json({ message: message_2 });
});

const fetchAndStoreOrders = async () => {
  try {
    console.log("⏳ Fetching orders from WooCommerce API...");

    const { data } = await axios.get(
      "https://a2mstore.com/wp-json/wc/v3/orders",
      {
        auth: {
          username: process.env.CONSUMERKEY,
          password: process.env.CONSUMERSECRET,
        },
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.CONSUMERKEY}:${process.env.CONSUMERSECRET}`
            ).toString("base64"),
          "Content-Type": "application/json",
        },
      }
    );

    for (const item of data) {
      const existingOrder = await orderModel.findOne({ SKU: `WP-${item.id}` });

      // Extract customer (fetch from DB or set to null)
      const customerDoc = await customerModel.findOneAndUpdate(
        { phone: item.billing.phone }, // Search by unique phone number
        {
          $setOnInsert: {
            name: `${item.billing.first_name} ${item.billing.last_name}`,
            email:
              item.billing.email || `unknown-${item.billing.phone}@example.com`, // Ensure email
            phone: item.billing.phone,
            governorate: item.billing.city || "Unknown",
            country: item.billing.state || "Unknown",
            company: item.billing.company || "Unknown",
            postCode: item.billing.postcode || "Unknown",
            addresses: [
              {
                address: item.billing.address_1 || "Unknown Address",
              },
              {
                address: item.billing.address_2 || "Unknown Address",
              },
            ],
            createdBy: new mongoose.Types.ObjectId(
              `${process.env.WEBSITEADMIN}`
            ),
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: true,
          userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
        } // Create if not exists
      );

      const customerId = customerDoc?._id;

      const shippingDoc = await shippingCompanyModel.findOneAndUpdate(
        { phone: item.shipping.phone }, // Search by unique phone number
        {
          $setOnInsert: {
            name: `${item.shipping.first_name} ${item.shipping.last_name}`,
            email:
              item.shipping.email ||
              `unknown-${item.shipping.phone}@example.com`, // Ensure email
            phone: item.shipping.phone,
            governorate: item.shipping.city || "Unknown",
            country: item.shipping.state || "Unknown",
            company: item.shipping.company || "Unknown",
            postCode: item.shipping.postcode || "Unknown",
            addresses: [
              {
                address: item.shipping.address_1 || "Unknown Address",
              },
              {
                address: item.shipping.address_2 || "Unknown Address",
              },
            ],
            createdBy: new mongoose.Types.ObjectId(
              `${process.env.WEBSITEADMIN}`
            ),
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: true,
          userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
        } // Create if not exists
      );

      const shippingId = shippingDoc?._id;
      let couponId = null;
      const isValidDate = (date) => {
        return date && !isNaN(new Date(date).getTime());
      };
      if (item.coupon_lines.length > 0) {
        for (const coupon of item.coupon_lines) {
          const couponDoc = await couponModel.findOneAndUpdate(
            { code: coupon.code },
            {
              discount: parseFloat(coupon.discount),
              expires: isValidDate(coupon.date_expires)
                ? new Date(coupon.date_expires)
                : null, // ✅ Handle invalid dates
              description: coupon.description || "No Description",
              type: coupon.discount_type || "percent",
              nominalAmount: coupon.nominal_amount || 0,
              freeShipping: coupon.free_shipping || false,
              createdBy: new mongoose.Types.ObjectId(
                `${process.env.WEBSITEADMIN}`
              ),
            },
            {
              new: true,
              runValidators: true,
              userId: new mongoose.Types.ObjectId(
                `${process.env.WEBSITEADMIN}`
              ),
              upsert: true,
            }
          );

          couponId = couponDoc?._id;
        }
      }
      // Extract order products
      const orderProducts = await Promise.all(
        item.line_items.map(async (product) => {
          const productDoc = await productModel.findOne({
            SKU: `WP-${product.product_id}`,
          });
          return productDoc
            ? {
                product: productDoc._id,
                quantity: product.quantity,
                price: parseFloat(product.price),
              }
            : null;
        })
      );

      const filteredProducts = orderProducts.filter((prod) => prod !== null);

      let orderData = {
        orderNumber: item.id || " ",
        SKU: `WP-${item.id}`,
        supplier: null,
        shippingCompany: shippingId,
        branch: new mongoose.Types.ObjectId(process.env.WEBSITEBRANCHID),
        customer: customerId,
        customerNotes: item.customer_note,
        coupon: couponId,
        // coupon: item.coupon_lines,
        // coupon: item.coupon_lines== [] ? null : item.coupon_lines,

        address: item.shipping.address_1 || "Unknown Address",
        governorate: item.shipping.state || "Unknown",
        totalAmountBeforeDiscount: parseFloat(Number(item.total)),
        totalAmount: item.line_items.reduce(
          (sum, item) => sum + parseFloat(item.total),
          0
        ),
        orderStatus: item.status,
        products: filteredProducts,
        shippingPrice: parseFloat(item.shipping_total),
        createdBy: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
      };

      if (existingOrder) {
        await orderModel.findByIdAndUpdate(existingOrder._id, orderData, {
          userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
          runValidators: true,
          new: true,
        });
        console.log(`✅ Order updated: ${item.id}`);
      } else {
        orderData.createdBy = new mongoose.Types.ObjectId(
          `${process.env.WEBSITEADMIN}`
        );
        const newOrder = new orderModel(orderData);
        await newOrder.save();
        console.log(`✅ Order created: ${item.id}`);
      }

      if (["shipping", "completed"].includes(item.status)) {
        for (const prod of filteredProducts) {
          // console.log(prod,"prod");

          await productModel.findByIdAndUpdate(
            prod.product,
            {
              $inc: { "store.0.quantity": -prod.quantity }, // Subtract quantity
            },
            {
              userId: new mongoose.Types.ObjectId(
                `${process.env.WEBSITEADMIN}`
              ),
              runValidators: true,
            }
          );
        }
      }
    }
    console.log("✅ Orders updated successfully!");
  } catch (error) {
    console.error("❌ Error fetching orders:", error.message);
  }
};

// Run the function
fetchAndStoreOrders();

cron.schedule("0 */6 * * *", () => {
  console.log("🔄 Running scheduled product update...");
  fetchAndStoreOrders();
});
export {
  createOrder,
  getAllOrder,
  getOrderById,
  getAllOrdersByStatus,
  getAllOrdersByShippingCompany,
  exportOrder,
  deleteOrder,
  updateOrder,
};
