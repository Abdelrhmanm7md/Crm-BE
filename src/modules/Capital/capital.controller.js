import { capitalModel } from "../../../database/models/capital.model.js";
import { productModel } from "../../../database/models/product.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
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
      $group: {
        _id: null,
        totalAmount: {
          $sum: {
            $subtract: [
              {
                $cond: {
                  if: { $gt: ["$salePrice", 0] }, // If salePrice exists and is > 0
                  then: "$salePrice", // Use salePrice
                  else: "$sellingPrice", // Otherwise, use sellingPrice
                },
              },
              "$costPrice", // Subtract costPrice
            ],
          },
          },
        totalCostPrice: {
          $sum: "$costPrice",
        },
        totalSellingPrice: {
          $sum: "$sellingPrice",
        },
      },
    },
  ]);
  let amount = amountResult[0]?.totalAmount
  const productsData = {
    reason : "Products",
    amount : amount,
    totalCostPrice : amountResult[0]?.totalCostPrice,
    totalSellingPrice : amountResult[0]?.totalSellingPrice
  }

  results.push(productsData)
  let totalProfit = results.reduce((total, item) => {
    return total + item.amount;
  })
  res.json({ message: "Done",totalProfit , results });

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
