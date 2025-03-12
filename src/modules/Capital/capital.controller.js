import { capitalModel } from "../../../database/models/capital.model.js";
import { orderModel } from "../../../database/models/order.model.js";
import { productModel } from "../../../database/models/product.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createCapital = catchAsync(async (req, res, next) => {  
    req.body.createdBy = req.user._id;
    let newCapital = new capitalModel(req.body);
    let addedCapital = await newCapital.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Capital has been created successfully!",
      addedCapital,
    });
  });
  

const getAllCapital = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(capitalModel.find(), req.query)

  let results = await ApiFeat.mongooseQuery;
  const amountResult = await productModel.aggregate([
    {
      $unwind: {
        path: "$productVariations",
        preserveNullAndEmptyArrays: true, // Keep products even if they have no variations
      },
    },
    {
      $group: {
        _id: null,
        productsCount: { $sum: 1 }, // Count all valid products
        totalAmount: {
          $sum: {
            $subtract: [
              { 
                $ifNull: ["$productVariations.salePrice", "$productVariations.sellingPrice"] 
              },
              { $ifNull: ["$productVariations.costPrice", 0] },
            ],
          },
        },
        totalCostPrice: {
          $sum: { $ifNull: ["$productVariations.costPrice", 0] },
        },
        totalSalePrice: {
          $sum: { $ifNull: ["$productVariations.salePrice", 0] },
        },
        totalSellingPrice: {
          $sum: { $ifNull: ["$productVariations.sellingPrice", 0] },
        },
      },
    },
  ]);

  const productsData = {
    reason : "Products",
    amount : amountResult[0]?.totalAmount,
    productsCount : amountResult[0]?.productsCount,
    totalCostPrice : amountResult[0]?.totalCostPrice,
    totalSellingPrice : amountResult[0]?.totalSellingPrice
  }

  const orderResult = await orderModel.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "completed"] }, 1, 0] },
        }, 
        totalCompletedAmount: {
          $sum: {
            $cond: [
              { $eq: ["$orderStatus", "completed"] }, 
              { $subtract: ["$totalAmount", "$shippingPrice"] }, 
              0,
            ],
          },
        },
      },
    },
  ]);
  
  const ordersData = {
    reason : "Orders",
    amount : orderResult[0]?.totalCompletedAmount,
    completedOrdersCount : orderResult[0]?.completedOrders,
  }

  results.push(ordersData)
  let realTotalProfit = results.reduce((total, item) => {
    return total + (item.amount || 0); 
  }, 0);
  results.push(productsData)
  let expectedTotalProfit = results.reduce((total, item) => {
    return total + (item.amount || 0); 
  }, 0);
  res.json({ message: "Done",expectedTotalProfit,realTotalProfit , results });

});


const getCapitalById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Capital = await capitalModel.findById(id);
  let message_1 = "No Capital was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على عميل!"
  }
  if (!Capital || Capital.length === 0) {
    return res.status(404).json({ message: message_1 });
  }


  res.status(200).json({ message: "Done", Capital });
});
const updateCapital = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedCapital = await capitalModel.findByIdAndUpdate(id, req.body, {
    new: true,userId: req.userId, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "Capital updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث رأس المال بنجاح!"
  }
  if (!updatedCapital) {
    return res.status(404).json({ message: message_1});
  }

  res
    .status(200)
    .json({ message: message_2, updatedCapital });
});
const deleteCapital = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  let customer = await capitalModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "Capital deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
    message_2 = "تم حذف رأس المال بنجاح!"
  }
  if (!customer) {
    return res.status(404).json({ message: message_1 });
  }

  customer.userId = req.userId;
  await customer.deleteOne();

  res.status(200).json({ message: message_2 });
});

export {
  createCapital,
  getAllCapital,
  getCapitalById,
  deleteCapital,
  updateCapital,
};
