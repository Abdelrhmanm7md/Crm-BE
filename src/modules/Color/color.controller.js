import { colorModel } from "../../../database/models/color.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createColor = catchAsync(async (req, res, next) => {  
    let newColor = new colorModel(req.body);
    let addedColor = await newColor.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Color has been created successfully!",
      addedColor,
    });
  });
  

const getAllColor = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(colorModel.find(), req.query)

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});


const getColorById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Color = await colorModel.findById(id);
  let message_1 = "No Color was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على اللون!"
  }
  if (!Color || Color.length === 0) {
    return res.status(404).json({ message: message_1 });
  }


  res.status(200).json({ message: "Done", Color });
});
const updateColor = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedColor = await colorModel.findByIdAndUpdate(id, req.body, {
    new: true,userId: req.userId, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "Color updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث بنجاح!"
  }
  if (!updatedColor) {
    return res.status(404).json({ message: message_1});
  }

  res
    .status(200)
    .json({ message: message_2, updatedColor });
});
const deleteColor = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  // Find the Color first
  let Color = await colorModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "Color deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
    message_2 = "تم حذف بنجاح!"
  }
  if (!Color) {
    return res.status(404).json({ message: message_1 });
  }

  await Color.deleteOne();

  res.status(200).json({ message: message_2});
});

export {
  createColor,
  getAllColor,
  getColorById,
  deleteColor,
  updateColor,
};
