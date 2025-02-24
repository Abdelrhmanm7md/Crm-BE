import { capitalModel } from "../../../database/models/capital.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createCapital = catchAsync(async (req, res, next) => {  
    req.body.createdBy = req.user._id;
    let newCapital = new capitalModel(req.body);
    let addedCapital = await newCapital.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Capital has been created successfully!",
      addedCapital,
    });
  });
  

const getAllCapital = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(capitalModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
//     let message_1 = "No Capital was found!"
//     if(req.query.lang == "ar"){
//       message_1 = "لم يتم العثور على عميل!"
//     }
//  !ApiFeat && res.status(404).json({ message: message_1 });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const exportCapital = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    capitalModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const getCapitalById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Capital = await capitalModel.findById(id);
  let message_1 = "No Capital was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على عميل!"
  }
  if (!Capital || Capital.length === 0) {
    return res.status(404).json({ message: message_1 });
  }


  res.status(200).json({ message: "Done", Capital });
});
const updateCapital = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedCapital = await capitalModel.findByIdAndUpdate(id, req.body, {
    new: true,userId: req.userId, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "Capital updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث رأس المال بنجاح!"
  }
  if (!updatedCapital) {
    return res.status(404).json({ message: message_1});
  }

  res
    .status(200)
    .json({ message: message_2, updatedCapital });
});
const deleteCapital = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  let customer = await capitalModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "Capital deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
    message_2 = "تم حذف رأس المال بنجاح!"
  }
  if (!customer) {
    return res.status(404).json({ message: message_1 });
  }

  customer.userId = req.userId;
  await customer.deleteOne();

  res.status(200).json({ message: message_2 });
});

export {
  createCapital,
  getAllCapital,
  exportCapital,
  getCapitalById,
  deleteCapital,
  updateCapital,
};
