import { expensesModel } from "../../../database/models/expenses.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createExpenses = catchAsync(async (req, res, next) => {  
    req.body.createdBy = req.user._id;
    let newExpenses = new expensesModel(req.body);
    let addedExpenses = await newExpenses.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Expenses has been created successfully!",
      addedExpenses,
    });
  });
  

const getAllExpenses = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(expensesModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
//     let message_1 = "No Expenses was found!"
//     if(req.query.lang == "ar"){
//       message_1 = "لم يتم العثور على عميل!"
//     }
//  !ApiFeat && res.status(404).json({ message: message_1 });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const exportExpenses = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    expensesModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const getExpensesById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Expenses = await expensesModel.findById(id);
  let message_1 = "No Expenses was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على عميل!"
  }
  if (!Expenses || Expenses.length === 0) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: "Done", Expenses });
});
const updateExpenses = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedExpenses = await expensesModel.findByIdAndUpdate(id, req.body, {
    new: true, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "Expenses updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث الربح بنجاح!"
  }
  if (!updatedExpenses) {
    return res.status(404).json({ message: message_1});
  }

  res
    .status(200)
    .json({ message: message_2, updatedExpenses });
});
const deleteExpenses = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  // Find the customer first
  let customer = await expensesModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "Expenses deleted successfully!"
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
  createExpenses,
  getAllExpenses,
  exportExpenses,
  getExpensesById,
  deleteExpenses,
  updateExpenses,
};
