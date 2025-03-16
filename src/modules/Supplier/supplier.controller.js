import { supplierModel } from "../../../database/models/supplier.model.js";
import { supplierOrderModel } from "../../../database/models/supplierOrder.model.js";
import ApiFeature from "../../utils/apiFeature.js";
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
  await ApiFeat.pagination(); 

  let suppliers = await ApiFeat.mongooseQuery;

  const supplierIds = suppliers.map(supplier => supplier._id);

  const payments = await supplierOrderModel.aggregate([
    { $match: { supplier: { $in: supplierIds } } }, // Filter by supplier IDs
    { 
      $group: { 
        _id: "$supplier", 
        totalRemainingPayment: { $sum: "$remainingPayment" } 
      } 
    }
  ]);

  let paymentMap = new Map(payments.map(p => [p._id.toString(), p.totalRemainingPayment]));

  suppliers = suppliers.map(supplier => {
    let supplierObj = supplier.toObject();
    supplierObj.totalRemainingPayment = paymentMap.get(supplier._id.toString()) || 0;
    return supplierObj;
  });

  res.json({ message: "Done", page: ApiFeat.page, totalPages: ApiFeat.totalPages, results: suppliers });
});


const getSupplierById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let supplier = await supplierModel.find({ _id: id }); // ✅ Fetch a single document
  let message_1 = req.query.lang === "ar" ? "لم يتم العثور على مورد" : "No Supplier was found!";

  if (!supplier) {
    return res.status(404).json({ message: message_1 });
  }
supplier = supplier[0];
  let orders = await supplierOrderModel.find({ supplier: supplier._id });

  supplier = supplier.toObject(); // ✅ Now it works because it's a single document
  supplier.orders = orders;

  res.status(200).json({ 
    message: "Done", 
    results: supplier 
  });
});

const exportSupplier = catchAsync(async (req, res, next) => {
  // Define variables before passing themconst exportUsers = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(supplierModel.find(), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });

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
