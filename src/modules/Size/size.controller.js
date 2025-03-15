import { sizeModel } from "../../../database/models/size.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createSize = catchAsync(async (req, res, next) => {  
    let newSize = new sizeModel(req.body);
    let addedSize = await newSize.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Size has been created successfully!",
      addedSize,
    });
  });
  

const getAllSize = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(sizeModel.find(), req.query)

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});


const getSizeById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Size = await sizeModel.findById(id);
  let message_1 = "No Size was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور!"
  }
  if (!Size || Size.length === 0) {
    return res.status(404).json({ message: message_1 });
  }


  res.status(200).json({ message: "Done", Size });
});
const updateSize = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedSize = await sizeModel.findByIdAndUpdate(id, req.body, {
    new: true,userId: req.userId, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "Size updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث بنجاح!"
  }
  if (!updatedSize) {
    return res.status(404).json({ message: message_1});
  }

  res
    .status(200)
    .json({ message: message_2, updatedSize });
});
const deleteSize = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  // Find the Size first
  let Size = await sizeModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "Size deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
    message_2 = "تم حذف بنجاح!"
  }
  if (!Size) {
    return res.status(404).json({ message: message_1 });
  }

  await Size.deleteOne();

  res.status(200).json({ message: message_2});
});

export {
  createSize,
  getAllSize,
  getSizeById,
  deleteSize,
  updateSize,
};
