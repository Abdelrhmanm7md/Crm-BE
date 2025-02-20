import { userModel } from "../../../database/models/user.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import AppError from "../../utils/appError.js";
import exportData from "../../utils/export.js";


const getAllUsersByAdmin = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(
    userModel.find().limit(10),
    req.query
  ).search();
  let message = "No users was found! add a new user to get started!";
  if (req.query.lang == "ar") {
    message = "لا يوجد مستخدمين! أضف مستخدم جديد للبدء!";
  }
  let results = await ApiFeat.mongooseQuery;
  if (!results) {
    return res.status(404).json({
      message
    });
  }
  res.json({
    message: "Done",
    countAllUsers: await userModel.countDocuments(),
    // countOwners: await userModel.countDocuments({ role: "66d33a4b4ad80e468f231f83" }),
    // countContractors: await userModel.countDocuments({ role: "66d33ec44ad80e468f231f91" }),
    // countConsultant: await userModel.countDocuments({ role: "66d33e7a4ad80e468f231f8d" }),
    results,
  });
});

const getUserById = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let message = "User Not found";
  if (req.query.lang == "ar") {
    message = "المستخدم غير موجود";
  }
  let results = await userModel.findById(id);
  !results && next(new AppError(message, 404));
  let lastSignIn = req.lastSignIn;
  results && res.json({ message: "Done", results, lastSignIn });
});


const updateUser = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let err = "couldn't update! not found!";
  if (req.query.lang == "ar") {
    err = "لا يمكن التحديث! المستخدم غير موجود";
  }
  let results = await userModel.findByIdAndUpdate(id,req.body,{new: true });
  !results && res.status(404).json({ message: err });
  results && res.json({ message: "user updated successfully", results });
});

const exportUsers = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    userModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});


const deleteUser = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let user = await userModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
  }
  if (!user) {
    return res.status(404).json({ message: message_1 });
  }

  user.userId = req.userId;
  await user.deleteOne();

  res.status(200).json({ message: "User deleted successfully!" });
});


export {
  getAllUsersByAdmin,
  getUserById,
  updateUser,
  exportUsers,
  deleteUser,
};
