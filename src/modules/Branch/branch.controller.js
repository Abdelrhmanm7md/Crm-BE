import { branchModel } from "../../../database/models/branch.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createBranch = catchAsync(async (req, res, next) => {
    let newBranch = new branchModel(req.body);
    let addedBranch = await newBranch.save();
  
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
 !ApiFeat && res.status(404).json({ message: "No Branch was found!" });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const getBranchById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Branch = await branchModel.findById(id);

 !Branch && res.status(404).json({ message: "Branch not found!" });


  res.status(200).json({ message: "Done", Branch });
});
const updateBranch = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedBranch = await branchModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  if (!updatedBranch) {
    return res.status(404).json({ message: "Couldn't update!  not found!" });
  }

  res
    .status(200)
    .json({ message: "Branch updated successfully!", updatedBranch });
});
const deleteBranch = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let deletedBranch = await branchModel.findByIdAndDelete({ _id: id });

  if (!deletedBranch) {
    return res.status(404).json({ message: "Couldn't delete!  not found!" });
  }

  res.status(200).json({ message: "Branch deleted successfully!" });
});

export {
  createBranch,
  getAllBranch,
  getBranchById,
  deleteBranch,
  updateBranch,
};
