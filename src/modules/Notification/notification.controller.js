import { notificationModel } from "../../../database/models/notification.model.js";
import { userModel } from "../../../database/models/user.model.js";
import { sio } from "../../../server.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const getAllNotification = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let results = null;
  const DaysAgo = new Date();
  let day = Number(req.query.days) || 7;
  DaysAgo.setDate(DaysAgo.getDate() - day);
  results = await notificationModel
    .find({
      receiver: { $eq: id},
      createdAt: { $gte: DaysAgo },
    })
    .sort({ $natural: -1 });
  res.json({ message: "Done", results });
});

const createNotification = catchAsync(async (req, res, next) => {
  // req.body.model = "66ba0122ff7376971c929636";

  let message = req.body.message;
  let icon = req.body.icon;

  if (!Array.isArray(req.body.receivers)) {
    req.body.receivers = [req.body.receivers];
  }
  let receivers = req.body.receivers;
  let savedNotif = null;

  for (let index = 0; index < receivers.length; index++) {
    let receiver = receivers[index];
    const newNotif = new notificationModel({ message, icon, receiver });
    savedNotif = await newNotif.save();
    let createdAt = savedNotif.createdAt;
    sio.emit(`notification_`, { message }, { icon }, { receiver },{createdAt});
  }

  res.status(201).json({
    message: "notification created successfully!",
    savedNotif,
  });
});

const updateNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let err_1 = "Couldn't update!  not found!";
  if (req.query.lang == "ar") {
    err_1 = "لا يمكن التعديل!  غير موجود";
  }
  let { isRead } = req.body;
  const updatedNotification = await notificationModel.findByIdAndUpdate(
    id,
    { isRead },
    { new: true }
  );

  if (!updatedNotification) {
    return res.status(404).json({ message: err_1 });
  }

  res
    .status(200)
    .json({
      message: "notification updated successfully!",
      updatedNotification,
    });
});
const updateAllNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let err_1 = "Couldn't update!  not found!";
  let err_2 = "Couldn't update! user not found!";
  if (req.query.lang == "ar") {
    err_1 = "لا يمكن التعديل!  غير موجود";
    err_2 = "لا يمكن التعديل! المستخدم غير موجود";
  }
  let check = await userModel.findById(id);
  if (!check) {
    return res.status(404).json({ message: err_2 });
  }
  // if (!Array.isArray(req.body)) {
  //   req.body = [req.body];
  // }
    const updatedNotification = await notificationModel.updateMany(
    {receiver:id},
    { isRead :true },
    { new: true }
  );

  if (!updatedNotification) {
    return res.status(404).json({ message: err_1 });
  }

  res
    .status(200)
    .json({
      message: "notification updated successfully!",
      updatedNotification,
    });
});
const deleteNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let err_1 = "Couldn't Delete!  not found!";
  if (req.query.lang == "ar") {
    err_1 = "لا يمكن المسح!  غير موجود";
  }
  const deletedNotification = await notificationModel.findByIdAndDelete(id);

  if (!deletedNotification) {
    return res.status(404).json({ message: err_1 });
  }

  res.status(200).json({ message: "notification deleted successfully!" });
});
const clearNotification = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let err_1 = "Couldn't Delete!  not found!";
  if (req.query.lang == "ar") {
    err_1 = "لا يمكن المسح!  غير موجود";
  }
  let all = await notificationModel.deleteMany({ receivers: { $in: [id] } });

  if (!all) {
    return res.status(404).json({ message: err_1 });
  }

  res.status(200).json({ message: "Notification deleted successfully!" });
});

export {
  createNotification,
  deleteNotification,
  getAllNotification,
  clearNotification,
  updateNotification,
  updateAllNotification,
};
