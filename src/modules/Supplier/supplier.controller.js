import { supplierModel } from "../../../database/models/supplier.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createSupplier = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  let newSupplier = new supplierModel(req.body);
  let addedSupplier = await newSupplier.save({ context: { query: req.query } });

  res.status(201).json({
    message: "Supplier has been created successfully!",
    addedSupplier,
  });
});

const getAllSupplier = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(supplierModel.find(), req.query);
  // .pagination()
  // .filter()
  // .sort()
  // .search()
  // .fields();

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });
});

const getSupplierById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Supplier = await supplierModel.find({_id:id});
  let message_1 = "No Supplier was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على مورد"
  }
  if (!Supplier || Supplier.length === 0) {
    return res.status(404).json({ message: message_1 });
  }
  Supplier = Supplier[0];
  res.status(200).json({ message: "Done", Supplier });
});

const exportSupplier = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    supplierModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const updateSupplier = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedSupplier = await supplierModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    context: "query",
    userId: req.userId, // ✅ Pass userId for logging
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "Supplier updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث المورد بنجاح!"
  }

  if (!updatedSupplier) {
    return res.status(404).json({ message: message_1 });
  }
  res
    .status(200)
    .json({ message: message_2, updatedSupplier });
});

const deleteSupplier = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let supplier = await supplierModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "Supplier deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
    message_2 = "تم حذف المورد بنجاح!"
  }
  if (!supplier) {
    return res.status(404).json({ message: message_1 });
  }

  supplier.userId = req.userId;
  await supplier.deleteOne();

  res.status(200).json({ message: message_2 });
});


export {
  createSupplier,
  getAllSupplier,
  getSupplierById,
  exportSupplier,
  deleteSupplier,
  updateSupplier,
};
