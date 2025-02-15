import { userModel } from "../../../database/models/user.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import AppError from "../../utils/appError.js";


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
      message: "No users was found! add a new user to get started!",
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
  if (req.body.dateOfBirth) {
    req.body.dateOfBirth = DateTime.fromISO(req.body.dateOfBirth).toISODate();
  }
  let {
    name,
    phone,
    password,
    dateOfBirth,
    role,
    projects,
    verificationCode,
    tags,
    otp,
    userType,
    userGroups,
    access,
    plan,
  } = req.body;
  let results = await userModel.findByIdAndUpdate(
    id,
    {
      $push: { projects, tags, userGroups },
      name,
      phone,
      password,
      dateOfBirth,
      role,
      otp,
      verificationCode,
      userType,
      access,
    },
    { new: true }
  );
  !results && res.status(404).json({ message: err });
  results && res.json({ message: "user updated successfully", results });
});


const updateUser2 = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let { projects, tags, userGroups } = req.body;
  let err = "couldn't update! not found!";
  if (req.query.lang == "ar") {
    err = "لا يمكن التحديث! المستخدم غير موجود";
  }
  let results = await userModel.findByIdAndUpdate(
    id,
    {
      $pull: { projects, tags, userGroups },
    },
    { new: true }
  );
  !results && res.status(404).json({ message: err });
  results && res.json({ message: "user updated successfully", results });
});

const deleteUser = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let err = "couldn't Delete! not found!";
  if (req.query.lang == "ar") {
    err = "لا يمكن المسح! المستخدم غير موجود";
  }
  let deletedUser = await userModel.deleteOne({ _id: id });

  if (!deletedUser) {
    return res.status(404).json({ message: err });
  }

  res.status(200).json({ message: "User deleted successfully!" });
});


export {
  getAllUsersByAdmin,
  getUserById,
  updateUser,
  updateUser2,
  deleteUser,
};
