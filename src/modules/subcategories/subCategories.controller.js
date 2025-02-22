import { subCategoryModel } from "../../../database/models/subcategory.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import AppError from "../../utils/appError.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createSubCategory = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  let results = new subCategoryModel(req.body);
  let added = await results.save({ context: { query: req.query } });
  res.status(201).json({ message: "added", added });
});

const getAllSubCategories = catchAsync(async (req, res, next) => {
  let apiFeature = new ApiFeature(subCategoryModel.find(), req.query)
    .pagination()
    .sort()
    .search()
    .fields();
  let results = await apiFeature.mongooseQuery;
  res.json({ message: "Done", results });
});

const getSubCategoryById = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let results = await subCategoryModel.findById(id);
  let message_1 = "Sub Category not found!";
  if (req.query.lang == "ar") {
    message_1 = "الفئة الفرعية غير موجودة!";
  }
  if (!results || results.length === 0) {
    return res.status(404).json({ message: message_1 });
  }
  res.json({ message: "Done", results });
});

const exportSub = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    subCategoryModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const updateSubCategory = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let results = await subCategoryModel.findByIdAndUpdate(id, req.body, {
    new: true, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!";
  let message_2 = "Sub Category updated successfully!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر التحديث! غير موجود!";
    message_2 = "تم تحديث الفئة الفرعية بنجاح!";
  }
  if (!results || results.length === 0) {
    return res.status(404).json({ message: message_1 });
  }
  results && res.json({ message: message_2, results });
});

const deleteSubCategory = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let subCategory = await subCategoryModel.findById(id);
  let message_1 = "Couldn't delete! Not found!";
  let message_2 = "Sub Category deleted successfully!";
  if (req.query.lang == "ar") {
    message_1 = "لم يتم الحذف! غير موجود!";
    message_2 = "تم حذف الفئة الفرعية بنجاح!";
  }
  if (!subCategory) {
    return res.status(404).json({ message: message_1 });
  }

  subCategory.userId = req.userId;
  await subCategory.deleteOne();

  res.status(200).json({ message: message_2 });
});

export {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  updateSubCategory,
  exportSub,
  deleteSubCategory,
};

// all product on brand

// parent brand
// child product

// http://localhost:3000/api/v1/category/6431bf25fdca014a813d95b5/subCategory

// http://localhost:3000/api/v1/subCategory

// brand
// refector
// products crud

// feature ... pagination ...sort ... search ...
