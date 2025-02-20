import { categoryModel } from "../../../database/models/category.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createCategory = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
    let newCategory = new categoryModel(req.body);
    let addedCategory = await newCategory.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Category has been created successfully!",
      addedCategory,
    });
  });
  

const getAllCategory = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(categoryModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
    let message_1 = "Category not found!"
    if(req.query.lang == "ar"){
      message_1 = "القسم غير موجود"
    }
 !ApiFeat && res.status(404).json({ message: message_1 });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const exportCategory = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    categoryModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const getCategoryById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Category = await categoryModel.findById(id);
  let message_1 = "Category not found!"
  if(req.query.lang == "ar"){
    message_1 = "القسم غير موجود"
  }
 !Category && res.status(404).json({ message: message_1 });


  res.status(200).json({ message: "Done", Category });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  // const { name, suppliersToAdd, suppliersToRemove } = req.body;

  // const update = { name};

  // if (suppliersToAdd && suppliersToAdd.length > 0) {
  //   update.$push = { suppliers: { $each: suppliersToAdd } };
  // }

  // if (suppliersToRemove && suppliersToRemove.length > 0) {
  //   update.$pull = { suppliers: { $in: suppliersToRemove } };
  // }

  // const updatedCategory = await categoryModel.findByIdAndUpdate(id, update, { new: true });
  const updatedCategory = await categoryModel.findByIdAndUpdate(id, req.body, { new: true, context: { query: req.query } });
  let message_1 = "Couldn't update!  not found!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
  }
  if (!updatedCategory) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: "Category updated successfully!", updatedCategory });
});
const deleteCategory = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  let category = await categoryModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر الحذف! غير موجود!"
  }

  if (!category) {
    return res.status(404).json({ message: message_1 });
  }

  category.userId = req.userId;
  await category.deleteOne();

  res.status(200).json({ message: "Category deleted successfully!" });
});

export {
  createCategory,
  getAllCategory,
  exportCategory,
  getCategoryById,
  deleteCategory,
  updateCategory,
};
