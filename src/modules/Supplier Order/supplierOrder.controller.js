import { supplierOrderModel } from "../../../database/models/supplierOrder.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createSupplierOrder = catchAsync(async (req, res, next) => {  
    req.body.createdBy = req.user._id;
    let newSupplierOrder = new supplierOrderModel(req.body);
    let addedSupplierOrder = await newSupplierOrder.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "SupplierOrder has been created successfully!",
      addedSupplierOrder,
    });
  });
  

const getAllSupplierOrder = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(supplierOrderModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
//     let message_1 = "No SupplierOrder was found!"
//     if(req.query.lang == "ar"){
//       message_1 = "لم يتم العثور على عميل!"
//     }
//  !ApiFeat && res.status(404).json({ message: message_1 });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});


const getSupplierOrderById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let SupplierOrder = await supplierOrderModel.findById(id);
  let message_1 = "No SupplierOrder was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على عميل!"
  }
  if (!SupplierOrder || SupplierOrder.length === 0) {
    return res.status(404).json({ message: message_1 });
  }


  res.status(200).json({ message: "Done", SupplierOrder });
});
const updateSupplierOrder = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedSupplierOrder = await supplierOrderModel.findByIdAndUpdate(id, req.body, {
    new: true, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "SupplierOrder updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث طلب المورد بنجاح!"
  }
  if (!updatedSupplierOrder) {
    return res.status(404).json({ message: message_1});
  }

  res
    .status(200)
    .json({ message: message_2, updatedSupplierOrder });
});
const deleteSupplierOrder = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  let customer = await supplierOrderModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "SupplierOrder deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
    message_2 = "تم حذف طلب المورد بنجاح!"
  }
  if (!customer) {
    return res.status(404).json({ message: message_1 });
  }

  customer.userId = req.userId;
  await customer.deleteOne();

  res.status(200).json({ message: message_2 });
});

export {
  createSupplierOrder,
  getAllSupplierOrder,
  getSupplierOrderById,
  deleteSupplierOrder,
  updateSupplierOrder,
};
