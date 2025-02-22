import { orderModel } from "../../../database/models/order.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createOrder = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
    let newOrder = new orderModel(req.body);
    let addedOrder = await newOrder.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Order has been created successfully!",
      addedOrder,
    });
  });
  

const getAllOrder = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(orderModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});
const exportOrder = catchAsync(async (req, res, next) => {
  const query = {}; 
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || []; 
  const specificIds = req.query.specificIds || [];

   await exportData(req, res, next, orderModel, query, projection, selectedFields, specificIds);

});

const getOrderById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let result = await orderModel.findById(id);
  let message_1 = "No Order was found!"
  if(req.query.lang == "ar"){
    message_1 = "لا يوجد طلبات!"
  }
  if (!result || result.length === 0) {
    return res.status(404).json({ message: message_1 });
  }


  res.status(200).json({ message: "Done", result });
});
const getAllOrdersByStatus = catchAsync(async (req, res, next) => {
  let { status } = req.params;

  let result = await orderModel.find({orderStatus: status});
  let message_1 = "No Order was found!"
  if(req.query.lang == "ar"){
    message_1 = "لا يوجد طلبات!"
  }
 !result && res.status(404).json({ message: message_1 });


  res.status(200).json({ message: "Done", result });
});
const getAllOrdersByShippingCompany = catchAsync(async (req, res, next) => {
  let { shippingId } = req.params;

  let result = await orderModel.find({shippingCompany: shippingId});
  let message_1 = "No Order was found!"
  if(req.query.lang == "ar"){
    message_1 = "لا يوجد طلبات!"
  }
 !result && res.status(404).json({ message: message_1 });


  res.status(200).json({ message: "Done", result });
});


const updateOrder = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedOrder = await orderModel.findByIdAndUpdate(id, req.body, {
    new: true, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  let message_2 = "Order updated successfully!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
    message_2 = "تم تحديث الطلب بنجاح!"
  }

  if (!updatedOrder) {
    return res.status(404).json({ message: message_1 });
  }

  res
    .status(200)
    .json({ message: message_2, updatedOrder });
});
const deleteOrder = catchAsync(async (req, res, next) => {
    let { id } = req.params;
  
    // Find the order first
    let order = await orderModel.findById(id);
    let message_1 = "Couldn't delete! Not found!"
    let message_2 = "Order deleted successfully!"
    if(req.query.lang == "ar"){
      message_1 = "لم يتم الحذف! غير موجود!"
      message_2 = "تم حذف الطلب بنجاح!"
    }
    if (!order) {
      return res.status(404).json({ message: message_1 });
    }
  
    // ✅ Attach orderId before deleting
    order.userId = req.userId;
    await order.deleteOne();
  
    res.status(200).json({ message: message_2 });
  });

export {
  createOrder,
  getAllOrder,
  getOrderById,
  getAllOrdersByStatus,
  getAllOrdersByShippingCompany,
  exportOrder,
  deleteOrder,
  updateOrder,
};
