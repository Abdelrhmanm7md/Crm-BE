import { branchModel } from "../../../database/models/branch.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createBranch = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
    let newBranch = new branchModel(req.body);
    let addedBranch = await newBranch.save({ context: { query: req.query } });
    res.status(201).json({
      message: "Branch has been created successfully!",
      addedBranch,
    });
  });
  

const getAllBranch = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(branchModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
    // let message_1 = "No Branch was found!"
    // if(req.query.lang == "ar"){
    //   message_1 = "لم يتم العثور على فرع!"
    // }

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const exportBranch = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    branchModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const getBranchById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Branch = await branchModel.find({_id:id});
  let message_1 = " Branch not found!"
  if(req.query.lang == "ar"){
    message_1 = "الفرع غير موجود!"
  }
  if (!Branch || Branch.length === 0) {
    return res.status(404).json({ message: message_1 });
  }

Branch=Branch[0]
  res.status(200).json({ message: "Done", Branch });
});
const updateBranch = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedBranch = await branchModel.findByIdAndUpdate(id, req.body, {
    new: true, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "Branch updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث الفرع بنجاح!"
  }
  if (!updatedBranch) {
    return res.status(404).json({ message: message_1 });
  }

  res
    .status(200)
    .json({ message: message_2, updatedBranch });
});
const deleteBranch = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  // Find the branch first
  let branch = await branchModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "Branch deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر الحذف! غير موجود!"
    message_2 = "تم حذف الفرع بنجاح!"
  }
  if (!branch) {
    return res.status(404).json({ message: message_1 });
  }

  // ✅ Attach branchId before deleting
  branch.userId = req.userId;
  await branch.deleteOne();

  res.status(200).json({ message: message_2 });
});

export {
  createBranch,
  getAllBranch,
  exportBranch,
  getBranchById,
  deleteBranch,
  updateBranch,
};
