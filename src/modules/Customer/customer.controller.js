import { customerModel } from "../../../database/models/customer.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createCustomer = catchAsync(async (req, res, next) => {  
    req.body.createdBy = req.user._id;
    let newCustomer = new customerModel(req.body);
    let addedCustomer = await newCustomer.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Customer has been created successfully!",
      addedCustomer,
    });
  });
  

const getAllCustomer = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(customerModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
    // let message_1 = "No Customer was found!"
    // if(req.query.lang == "ar"){
    //   message_1 = "لم يتم العثور على عميل!"
    // }

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const exportCustomer = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    customerModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const getCustomerById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Customer = await customerModel.findById(id);
  let message_1 = "No Customer was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على عميل!"
  }
  if (!Customer || Customer.length === 0) {
    return res.status(404).json({ message: message_1 });
  }


  res.status(200).json({ message: "Done", Customer });
});
const updateCustomer = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedCustomer = await customerModel.findByIdAndUpdate(id, req.body, {
    new: true,userId: req.userId, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "Customer updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث العميل بنجاح!"
  }
  if (!updatedCustomer) {
    return res.status(404).json({ message: message_1});
  }

  res
    .status(200)
    .json({ message: message_2, updatedCustomer });
});
const deleteCustomer = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  // Find the customer first
  let customer = await customerModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "Customer deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
    message_2 = "تم حذف العميل بنجاح!"
  }
  if (!customer) {
    return res.status(404).json({ message: message_1 });
  }

  customer.userId = req.userId;
  await customer.deleteOne();

  res.status(200).json({ message: message_2});
});

export {
  createCustomer,
  getAllCustomer,
  exportCustomer,
  getCustomerById,
  deleteCustomer,
  updateCustomer,
};
