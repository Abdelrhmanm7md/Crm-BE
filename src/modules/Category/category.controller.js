import { categoryModel } from "../../../database/models/category.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createCategory = catchAsync(async (req, res, next) => {
    let newCategory = new categoryModel(req.body);
    let addedCategory = await newCategory.save();
  
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
 !ApiFeat && res.status(404).json({ message: "No Category was found!" });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const getCategoryById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Category = await categoryModel.findById(id);

 !Category && res.status(404).json({ message: "Category not found!" });


  res.status(200).json({ message: "Done", Category });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, suppliersToAdd, suppliersToRemove } = req.body;

  const update = { name};

  if (suppliersToAdd && suppliersToAdd.length > 0) {
    update.$push = { suppliers: { $each: suppliersToAdd } };
  }

  if (suppliersToRemove && suppliersToRemove.length > 0) {
    update.$pull = { suppliers: { $in: suppliersToRemove } };
  }

  const updatedCategory = await categoryModel.findByIdAndUpdate(id, update, { new: true });

  if (!updatedCategory) {
    return res.status(404).json({ message: "Couldn't update! Not found!" });
  }

  res.status(200).json({ message: "Category updated successfully!", updatedCategory });
});
const deleteCategory = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let deletedCategory = await categoryModel.findByIdAndDelete({ _id: id });

  if (!deletedCategory) {
    return res.status(404).json({ message: "Couldn't delete!  not found!" });
  }

  res.status(200).json({ message: "Category deleted successfully!" });
});

export {
  createCategory,
  getAllCategory,
  getCategoryById,
  deleteCategory,
  updateCategory,
};
