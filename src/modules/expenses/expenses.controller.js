import { expensesModel } from "../../../database/models/expenses.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createExpenses = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  if(req.body.amount < 0){
    return next(new Error("Amount can't be negative"));
  }
  let newExpenses = new expensesModel(req.body);
  let addedExpenses = await newExpenses.save({ context: { query: req.query } });

  res.status(201).json({
    message: "Expenses has been created successfully!",
    addedExpenses,
  });
});

const getAllExpenses = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(expensesModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });
});
const getAllExpensesToday = catchAsync(async (req, res, next) => {
  let startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  let ApiFeat = new ApiFeature(
    expensesModel.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }),
    req.query
  );

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });
});
const getAllExpensesSpecificDate = catchAsync(async (req, res, next) => {
  let date = new Date(req.query.date + "T00:00:00.000Z");

  let startOfDay = new Date(date);
  let endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  let ApiFeat = new ApiFeature(
    expensesModel.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
    req.query
  );
  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });
});


const getExpensesById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Expenses = await expensesModel.findById(id);
  let message_1 = "No Expenses was found!";
  if (req.query.lang == "ar") {
    message_1 = "لم يتم العثور على عميل!";
  }
  if (!Expenses || Expenses.length === 0) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: "Done", Expenses });
});
const updateExpenses = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  if(req.body.amount < 0){
    return next(new Error("Amount can't be negative"));
  }
  let updatedExpenses = await expensesModel.findByIdAndUpdate(id, req.body, {
    new: true,
    userId: req.userId,
    context: { query: req.query },
  });
  let message_1 = "Couldn't update!  not found!";
  let message_2 = "Expenses updated successfully!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر التحديث! غير موجود!";
    message_2 = "تم تحديث الربح بنجاح!";
  }
  if (!updatedExpenses) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: message_2, updatedExpenses });
});
const deleteExpenses = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  // Find the customer first
  let customer = await expensesModel.findById(id);
  let message_1 = "Couldn't delete! Not found!";
  let message_2 = "Expenses deleted successfully!";
  if (req.query.lang == "ar") {
    message_1 = "لم يتم الحذف! غير موجود!";
    message_2 = "تم حذف الربح بنجاح!";
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
  getAllExpensesToday,
  getAllExpensesSpecificDate,
  getExpensesById,
  deleteExpenses,
  updateExpenses,
};
