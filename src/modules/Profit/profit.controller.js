import { profitModel } from "../../../database/models/profits.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createProfit = catchAsync(async (req, res, next) => {  
    req.body.createdBy = req.user._id;
    let newProfit = new profitModel(req.body);
    let addedProfit = await newProfit.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Profit has been created successfully!",
      addedProfit,
    });
  });
  

const getAllProfit = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(profitModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
//     let message_1 = "No Profit was found!"
//     if(req.query.lang == "ar"){
//       message_1 = "لم يتم العثور على عميل!"
//     }
//  !ApiFeat && res.status(404).json({ message: message_1 });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const exportProfit = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    profitModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const getProfitById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Profit = await profitModel.findById(id);
  let message_1 = "No Profit was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على عميل!"
  }
 !Profit && res.status(404).json({ message: message_1 });


  res.status(200).json({ message: "Done", Profit });
});
const updateProfit = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedProfit = await profitModel.findByIdAndUpdate(id, req.body, {
    new: true,userId: req.userId, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "Profit updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث الربح بنجاح!"
  }
  if (!updatedProfit) {
    return res.status(404).json({ message: message_1});
  }

  res
    .status(200)
    .json({ message: message_2, updatedProfit });
});
const deleteProfit = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  let customer = await profitModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "Profit deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
    message_2 = "تم حذف الربح بنجاح!"
  }
  if (!customer) {
    return res.status(404).json({ message: message_1 });
  }

  customer.userId = req.userId;
  await customer.deleteOne();

  res.status(200).json({ message: message_2 });
});

export {
  createProfit,
  getAllProfit,
  exportProfit,
  getProfitById,
  deleteProfit,
  updateProfit,
};
