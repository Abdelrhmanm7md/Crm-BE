import { customerModel } from "../../../database/models/customer.model.js";
import { orderModel } from "../../../database/models/order.model.js";
import { shippingCompanyModel } from "../../../database/models/shippingCompany.model.js";
import { supplierModel } from "../../../database/models/supplier.model.js";
import { userModel } from "../../../database/models/user.model.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
  
const getAllStats = catchAsync(async (req, res, next) => {
let results = {}
try{
  const orderCounts = await orderModel.aggregate([
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 },
      },
    },
  ]);
  
  const orderStats = {
    totalOrders: await orderModel.countDocuments(),
    completedOrders: 0,
    pendingOrders: 0,
    shippingOrders: 0,
    processingOrders: 0,
    onHoldOrders: 0,
    cancelledOrders: 0,
    refundedOrders: 0,
  };
  
  orderCounts.forEach(({ _id, count }) => {
    if (_id) {
      orderStats[`${_id}Orders`] = count;
    }
  });
  results.shippingCompanyCount = await shippingCompanyModel.countDocuments();  
  results.suppliersCount = await supplierModel.countDocuments();  
  results.customersCount = await customerModel.countDocuments();  
  results.usersCount = await userModel.countDocuments();
  const orderResult = await orderModel.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        }, // Group by year and month
        totalOrders: { $sum: 1 }, // Count total orders
        completedOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "completed"] }, 1, 0] },
        }, // Count completed orders
        processingOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "processing"] }, 1, 0] },
        }, // Count processing orders
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] },
        }, // Count cancelled orders
      },
    },
    {
      $sort: { "_id.year": -1, "_id.month": -1 }, // Sort by latest months first
    },
    { $limit: 6 }, // Get only the last 6 months
    {
      $project: {
        _id: 0,
        month: {
          $dateToString: {
            format: "%Y-%m",
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: 1, // Set day to 1 to create a valid date
              },
            },
          },
        },
        totalOrders: 1,
        completedOrders: 1,
        processingOrders: 1,
        cancelledOrders: 1,
      },
    },
  ]);
    results.orderResult = orderResult
  results = { ...results, ...orderStats };
}catch(err){
  return res.status(400).json({ message: err.message });
}
  res.json({ message: "Done", results });
});




export {
getAllStats
};
