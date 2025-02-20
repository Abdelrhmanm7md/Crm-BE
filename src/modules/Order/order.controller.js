import { couponModel } from "../../../database/models/coupon.model.js";
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
    let message_1 = "No Order was found!"
    if(req.query.lang == "ar"){
      message_1 = "لا يوجد طلبات!"
    }
  !ApiFeat && res.status(404).json({ message: message_1 });

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
 !result && res.status(404).json({ message: message_1 });


  res.status(200).json({ message: "Done", result });
});

const applyCoupon = catchAsync(async (req, res, next) => {
  // 1- get coupon from params
  // 2- get coupon discount
  // 3- calc discount

  let code = await couponModel.findOne({ code: req.params.code });
  let cart = await orderModel.findOne({ _id: req.params.id });
  let message_1 = "Coupon not found!"
  let message_2 = "Order not found!"
  if(req.query.lang == "ar"){
    message_1 = "الكوبون غير موجود!"
    message_2 = "الطلب غير موجود!"
  }
  if (!code) {
    return res.status(404).json({ message: message_1 });
  }
  if (!cart) {
    return res.status(404).json({ message: message_2 });
  }
if(code.discount != 0 && code.expires < new Date()){
  cart.totalPriceAfterDiscount = cart.totalAmount - (cart.totalAmount * code.discount) / 100;
  cart.discount = code.discount;
}
  await cart.save();
  res.json({message:"Done", cart})
})

const updateOrder = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedOrder = await orderModel.findByIdAndUpdate(id, req.body, {
    new: true, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
  }

  if (!updatedOrder) {
    return res.status(404).json({ message: message_1 });
  }

  res
    .status(200)
    .json({ message: "Order updated successfully!", updatedOrder });
});
const deleteOrder = catchAsync(async (req, res, next) => {
    let { id } = req.params;
  
    // Find the order first
    let order = await orderModel.findById(id);
    let message_1 = "Couldn't delete! Not found!"
    if(req.query.lang == "ar"){
      message_1 = "لم يتم الحذف! غير موجود!"
    }
    if (!order) {
      return res.status(404).json({ message: message_1 });
    }
  
    // ✅ Attach orderId before deleting
    order.userId = req.userId;
    await order.deleteOne();
  
    res.status(200).json({ message: "Order deleted successfully!" });
  });

export {
  createOrder,
  getAllOrder,
  getOrderById,
  exportOrder,
  deleteOrder,
  updateOrder,
  applyCoupon,
};
