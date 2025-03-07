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
import AppError from "../../utils/appError.js";
dotenv.config();

const createOrder = catchAsync(async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;

    // Calculate total before discount
    let totalBeforeDiscount = req.body.products.reduce((total, prod) => {
      return total + prod.price * prod.quantity;
    }, 0);

    req.body.totalAmountBeforeDiscount = totalBeforeDiscount;

    // Apply coupon if provided
    if (req.body.coupon) {
      let shippingPrice = 0;
      const coupon = await couponModel.findById(req.body.coupon);
      if (!coupon) return next(new AppError("Invalid coupon", 400));

      const now = new Date();
      if (coupon.expires && coupon.expires < now) {
        return next(new AppError("Coupon expired", 400));
      }

      // Check minimum amount requirement
      if (totalBeforeDiscount < coupon.minimumAmount) {
        return next(
          new AppError(
            `Order total must be at least ${coupon.minimumAmount} to use this coupon`,
            400
          )
        );
      }

      // Check global usage limit
      const totalUsage = await orderModel.countDocuments({ coupon: req.body.coupon });
      if (totalUsage >= coupon.usageLimit) {
        return next(new AppError("Coupon usage limit reached", 400));
      }

      // Check per-user usage limit
      const userUsage = await orderModel.countDocuments({ customer: req.body.customer, coupon: req.body.coupon });
      if (userUsage >= coupon.usageLimitPerUser) {
        return next(new AppError("User coupon limit exceeded", 400));
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discountType === "percent") {
        discountAmount = (totalBeforeDiscount * coupon.amount) / 100;
      } else if (coupon.discountType === "fixed_product") {
        discountAmount = coupon.amount;
      }

      // Ensure discount doesn't exceed total amount
      discountAmount = Math.min(discountAmount, totalBeforeDiscount);
if(coupon.freeShipping){
  shippingPrice = 0;
}else{
  shippingPrice = req.body.shippingPrice;
}
      // Set discounted total
      req.body.totalAmount = totalBeforeDiscount - discountAmount + shippingPrice;
    } else {
      req.body.totalAmount = totalBeforeDiscount + req.body.shippingPrice;
    }

    // Create and save order
    let newOrder = new orderModel(req.body);
    let addedOrder = await newOrder.save({ context: { query: req.query } });

    res.status(201).json({
      message: "Order has been created successfully!",
      addedOrder,
    });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
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
  try {
    const orderId = req.params.id;
    const existingOrder = await orderModel.findById(orderId);
    if (!existingOrder) return next(new AppError("Order not found", 404));

    // Update createdBy if modified
    if (req.user) {
      req.body.createdBy = req.user._id;
    }

    // Recalculate totalBeforeDiscount if products are updated
    if (req.body.products) {
      req.body.totalAmountBeforeDiscount = req.body.products.reduce(
        (total, prod) => total + prod.price * prod.quantity,
        0
      );
    } else {
      req.body.totalAmountBeforeDiscount = existingOrder.totalAmountBeforeDiscount;
    }

    let shippingPrice = req.body.shippingPrice || existingOrder.shippingPrice;
    let discountAmount = 0;

    // Apply coupon if provided
    if (req.body.coupon) {
      const coupon = await couponModel.findById(req.body.coupon);
      if (!coupon) return next(new AppError("Invalid coupon", 400));

      const now = new Date();
      if (coupon.expires && coupon.expires < now) {
        return next(new AppError("Coupon expired", 400));
      }

      // Check minimum amount requirement
      if (req.body.totalAmountBeforeDiscount < coupon.minimumAmount) {
        return next(
          new AppError(
            `Order total must be at least ${coupon.minimumAmount} to use this coupon`,
            400
          )
        );
      }

      // Check global usage limit
      const totalUsage = await orderModel.countDocuments({ coupon: req.body.coupon });
      if (totalUsage >= coupon.usageLimit) {
        return next(new AppError("Coupon usage limit reached", 400));
      }

      // Check per-user usage limit
      const userUsage = await orderModel.countDocuments({
        customer: existingOrder.customer,
        coupon: req.body.coupon,
      });
      if (userUsage >= coupon.usageLimitPerUser) {
        return next(new AppError("User coupon limit exceeded", 400));
      }

      // Calculate discount
      if (coupon.discountType === "percent") {
        discountAmount = (req.body.totalAmountBeforeDiscount * coupon.amount) / 100;
      } else if (coupon.discountType === "fixed_product") {
        discountAmount = coupon.amount;
      }

      // Ensure discount doesn't exceed total amount
      discountAmount = Math.min(discountAmount, req.body.totalAmountBeforeDiscount);

      // Apply free shipping if coupon allows
      if (coupon.freeShipping) {
        shippingPrice = 0;
      }
    }

    // Calculate the final total
    req.body.totalAmount = req.body.totalAmountBeforeDiscount - discountAmount + shippingPrice;

    // Update the order
    const updatedOrder = await orderModel.findByIdAndUpdate(orderId, req.body, {
      new: true,
      userId: req.userId,
      runValidators: true,
    });

    res.status(200).json({
      message: "Order has been updated successfully!",
      updatedOrder,
    });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
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

// const fetchAndStoreOrders = async () => {
//   try {
//     console.log("⏳ Fetching orders from WooCommerce API...");
//     let page = 1;
//     let allOrders = [];
//     let totalFetched = 0;
//     do {

    
//     const { data } = await axios.get(
//       "https://a2mstore.com/wp-json/wc/v3/orders",
//       {
//         params: {
//           per_page: 100, // Maximum limit per request (adjust as needed)
//           page: page,
//         },
//         auth: {
//           username: process.env.CONSUMERKEY,
//           password: process.env.CONSUMERSECRET,
//         },
//         headers: {
//           Authorization:
//             "Basic " +
//             Buffer.from(
//               `${process.env.CONSUMERKEY}:${process.env.CONSUMERSECRET}`
//             ).toString("base64"),
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     totalFetched = data.length;
//     allOrders.push(...data);
//     page++;
//   } while (totalFetched === 10000); // Continue fetching until no more allOrders

//   console.log(`✅ Fetched ${allOrders.length} Orders from WooCommerce`);
//     for (const item of allOrders) {
//       const existingOrder = await orderModel.findOne({ SKU: `WP-${item.id}` });

//       // 🔹 Extract customer
//       const customerDoc = await customerModel.findOneAndUpdate(
//         { phone: item.billing.phone },
//         {
//           $setOnInsert: {
//             name: `${item.billing.first_name} ${item.billing.last_name}`,
//             email:
//               item.billing.email || `unknown-${item.billing.phone}@example.com`,
//             phone: item.billing.phone,
//             governorate: item.billing.city || "Unknown",
//             country: item.billing.state || "Unknown",
//             company: item.billing.company || "Unknown",
//             postCode: item.billing.postcode || "Unknown",
//             addresses: [
//               { address: item.billing.address_1 || "Unknown Address" },
//               { address: item.billing.address_2 || "Unknown Address" },
//             ],
//             createdBy: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
//           },
//         },
//         { new: true, runValidators: true, upsert: true }
//       );

//       const customerId = customerDoc?._id;

//       // 🔹 Extract shipping company
//       const shippingDoc = await shippingCompanyModel.findOneAndUpdate(
//         { phone: item.shipping.phone },
//         {
//           $setOnInsert: {
//             name: `${item.shipping.first_name} ${item.shipping.last_name}`,
//             email:
//               item.shipping.email || `unknown-${item.shipping.phone}@example.com`,
//             phone: item.shipping.phone,
//             governorate: item.shipping.city || "Unknown",
//             country: item.shipping.state || "Unknown",
//             company: item.shipping.company || "Unknown",
//             postCode: item.shipping.postcode || "Unknown",
//             addresses: [
//               { address: item.shipping.address_1 || "Unknown Address" },
//               { address: item.shipping.address_2 || "Unknown Address" },
//             ],
//             createdBy: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
//           },
//         },
//         { new: true,
//            userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
//           runValidators: true, upsert: true }
//       );

//       const shippingId = shippingDoc?._id;

//       // 🔹 Extract products from order
//       const orderProducts = await Promise.all(
//         item.line_items.map(async (product) => {
//           const productDoc = await productModel.findOne({ wordPressId: product.product_id.toString() });

//           if (!productDoc) {
//             console.warn(`⚠️ Product not found for SKU: ${product.product_id}`);
//           }

//           return productDoc
//             ? {
//                 product: productDoc._id,
//                 quantity: product.quantity,
//                 price: parseFloat(product.price),
//               }
//             : null;
//         })
//       );

//       const filteredProducts = orderProducts.filter((prod) => prod !== null);
//       if (filteredProducts.length === 0) {
//         console.warn(`⚠️ No valid products found for order ID: ${item.id}`);
//       }

//       // 🔹 Fix totalAmount parsing issue
//       const totalAmount = item.line_items.reduce((sum, lineItem) => {
//         const totalValue = Array.isArray(lineItem.total) ? lineItem.total[0] : lineItem.total;
//         const parsedValue = Number.isFinite(Number(totalValue)) ? parseFloat(totalValue) : 0;
        
//         if (parsedValue === 0 && totalValue !== "0") {
//           console.warn(`⚠️ Skipping invalid total:`, totalValue);
//         }

//         return sum + parsedValue ;
//       }, 0);

//       let orderData = {
//         orderNumber: item.id || " ",
//         SKU: `WP-${item.id}`,
//         supplier: null,
//         shippingCompany: shippingId,
//         branch: new mongoose.Types.ObjectId(process.env.WEBSITEBRANCHID),
//         customer: customerId,
//         customerNotes: item.customer_note,
//         address: item.shipping.address_1 || "Unknown Address",
//         governorate: item.shipping.state || "Unknown",
//         totalAmountBeforeDiscount: totalAmount,
//         totalAmount : totalAmount + parseFloat(item.shipping_total), // 🔹 Fixed totalAmount calculation
//         orderStatus: item.status,
//         products: filteredProducts,
//         fromWordPress : true,
//         shippingPrice: parseFloat(item.shipping_total),
//         createdBy: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
//       };

//       if (existingOrder) {
//         await orderModel.findByIdAndUpdate(existingOrder._id, orderData, {
//           runValidators: true,
//           userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
//           new: true,
//         });
//         console.log(`✅ Order updated: ${item.id}`);
//       } else {
//         orderData.createdBy = new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`);
//         await orderModel.create(orderData);
//         console.log(`✅ Order created: ${item.id}`);
//       }

//       // 🔹 Reduce product stock if order status is "shipping"
//       if (["shipping"].includes(item.status)) {
//         for (const prod of filteredProducts) {
//           await productModel.findByIdAndUpdate(
//             prod.product,
//             { 
//               $inc: { "store.$[elem].quantity": -prod.quantity } // Subtract quantity for a specific branch 
//             },
//             { 
//               arrayFilters: [{ "elem.branch": new mongoose.Types.ObjectId(process.env.WEBSITEBRANCHID) }], // Select specific branch
//               runValidators: true,
//               userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`)
//             }
//           );
//         }
//       }
//     }
//     console.log("✅ Orders updated successfully!");
//   } catch (error) {
//     console.error("❌ Error fetching orders:", error.message);
//   }
// };


// Run the function


const fetchAndStoreOrders = async () => {
  try {
    console.log("⏳ Fetching orders from WooCommerce API...");
    let page = 1;
    let allOrders = [];
    let totalFetched = 0;
    
    do {
      const { data } = await axios.get(
        "https://a2mstore.com/wp-json/wc/v3/orders",
        {
          params: {
            per_page: 100,
            page: page,
          },
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

      totalFetched = data.length;
      allOrders.push(...data);
      page++;
    } while (totalFetched > 0);

    console.log(`✅ Fetched ${allOrders.length} Orders from WooCommerce`);

    for (const item of allOrders) {
      const existingOrder = await orderModel.findOne({ SKU: `WP-${item.id}` });

      // 🔹 Extract customer
      const customerDoc = await customerModel.findOneAndUpdate(
        { phone: item.billing.phone },
        {
          $setOnInsert: {
            name: `${item.billing.first_name} ${item.billing.last_name}`,
            email:
              item.billing.email || `unknown-${item.billing.phone}@example.com`,
            phone: item.billing.phone,
            governorate: item.billing.city || "Unknown",
            country: item.billing.state || "Unknown",
            company: item.billing.company || "Unknown",
            postCode: item.billing.postcode || "Unknown",
            addresses: [
              { address: item.billing.address_1 || "Unknown Address" },
              { address: item.billing.address_2 || "Unknown Address" },
            ],
            createdBy: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
          },
        },
        { new: true,userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`), runValidators: true, upsert: true }
      );

      const customerId = customerDoc?._id;

      // 🔹 Extract shipping company
      const shippingDoc = await shippingCompanyModel.findOneAndUpdate(
        { phone: item.shipping.phone },
        {
          $setOnInsert: {
            name: `${item.shipping.first_name} ${item.shipping.last_name}`,
            email:
              item.shipping.email || `unknown-${item.shipping.phone}@example.com`,
            phone: item.shipping.phone,
            governorate: item.shipping.city || "Unknown",
            country: item.shipping.state || "Unknown",
            company: item.shipping.company || "Unknown",
            postCode: item.shipping.postcode || "Unknown",
            addresses: [
              { address: item.shipping.address_1 || "Unknown Address" },
              { address: item.shipping.address_2 || "Unknown Address" },
            ],
            createdBy: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
          },
        },
        { new: true,userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`), runValidators: true, upsert: true }
      );

      const shippingId = shippingDoc?._id;

      // 🔹 Extract products and variations
      const orderProducts = [];
      const productVariations = [];

      for (const product of item.line_items) {
        const productDoc = await productModel.findOne({
          wordPressId: product.product_id.toString(),
        });

        if (!productDoc) {
          console.warn(`⚠️ Product not found for SKU: ${product.product_id}`);
          continue;
        }

        // Extract variation details from meta_data
        let color = "";
        let size = [];
        let photo = "";

        if (product.meta_data) {
          product.meta_data.forEach((meta) => {
            if (meta.key.toLowerCase().includes("color")) {
              color = meta.value;
            } else if (meta.key.toLowerCase().includes("size")) {
              size.push(meta.value);
            } else if (meta.key.toLowerCase().includes("image")) {
              photo = meta.value;
            }
          });
        }

        if (color || size.length > 0 || photo) {
          // This is a variation product
          productVariations.push({
            product: productDoc._id,
            quantity: product.quantity,
            color,
            size,
            photo,
          });
        } else {
          // Regular product
          orderProducts.push({
            product: productDoc._id,
            quantity: product.quantity,
            price: parseFloat(product.price),
          });
        }
      }

      // 🔹 Fix totalAmount parsing issue
      const totalAmount = item.line_items.reduce((sum, lineItem) => {
        const totalValue = Array.isArray(lineItem.total) ? lineItem.total[0] : lineItem.total;
        const parsedValue = Number.isFinite(Number(totalValue)) ? parseFloat(totalValue) : 0;
        
        if (parsedValue === 0 && totalValue !== "0") {
          console.warn(`⚠️ Skipping invalid total:`, totalValue);
        }

        return sum + parsedValue ;
      }, 0);

      let orderData = {
        orderNumber: item.id || " ",
        SKU: `WP-${item.id}`,
        supplier: null,
        shippingCompany: shippingId,
        branch: new mongoose.Types.ObjectId(process.env.WEBSITEBRANCHID),
        customer: customerId,
        customerNotes: item.customer_note,
        address: item.shipping.address_1 || "Unknown Address",
        governorate: item.shipping.state || "Unknown",
        totalAmountBeforeDiscount: totalAmount,
        totalAmount : totalAmount + parseFloat(item.shipping_total),
        orderStatus: item.status,
        products: orderProducts,
        productVariations: productVariations,
        fromWordPress: true,
        shippingPrice: parseFloat(item.shipping_total),
        createdBy: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
      };

      if (existingOrder) {
        await orderModel.findByIdAndUpdate(existingOrder._id, orderData, {
          runValidators: true,
          userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
          new: true,
        });
        console.log(`✅ Order updated: ${item.id}`);
      } else {
        orderData.createdBy = new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`);
        await orderModel.create(orderData);
        console.log(`✅ Order created: ${item.id}`);
      }

      // 🔹 Reduce product stock if order status is "shipping"
      if (["shipping"].includes(item.status)) {
        for (const prod of orderProducts) {
          if (!orderData.productVariations || orderData.productVariations.length === 0) {
            // If productVariations is empty, decrease stock from store.quantity
            await productModel.findByIdAndUpdate(
              prod.product,
              {
                $inc: { "store.$[elem].quantity": -prod.quantity }
              },
              {
                arrayFilters: [{ "elem.branch": new mongoose.Types.ObjectId(process.env.WEBSITEBRANCHID) }],
                runValidators: true,
                userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
              }
            );
          } else {
            // If productVariations exist, decrease stock from productVariations.quantity
            for (const variation of orderData.productVariations) {
              await productModel.findOneAndUpdate(
                {
                  _id: variation.product,
                  "productVariations.color": variation.color,
                  "productVariations.size": { $in: variation.size },
                  "productVariations.branch": new mongoose.Types.ObjectId(process.env.WEBSITEBRANCHID)
                },
                {
                  $inc: { "productVariations.$.quantity": -variation.quantity }
                },
                {
                  arrayFilters: [],
                  runValidators: true,
                  userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`)
                }
              );
            }
          }
        }
      }
    }

    console.log("✅ Orders updated successfully!");
  } catch (error) {
    console.error("❌ Error fetching orders:", error.message);
  }
};



fetchAndStoreOrders();

cron.schedule("* * * * *", () => {
  console.log("🔄 Running scheduled product update...");
  fetchAndStoreOrders();
});
export {
  createOrder,
  getAllOrder,
  getOrderById,
  getAllOrdersByStatus,
  getAllOrdersByShippingCompany,
  deleteOrder,
  updateOrder,
};
