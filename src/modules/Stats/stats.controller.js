import { customerModel } from "../../../database/models/customer.model.js";
import { orderModel } from "../../../database/models/order.model.js";
import { shippingCompanyModel } from "../../../database/models/shippingCompany.model.js";
import { supplierModel } from "../../../database/models/supplier.model.js";
import { userModel } from "../../../database/models/user.model.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
  
const getAllStats = catchAsync(async (req, res, next) => {
let results = {}
try{
  const orderCounts = await orderModel.aggregate([
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 },
      },
    },
  ]);
  
  const orderStats = {
    totalOrders: await orderModel.countDocuments(),
    completedOrders: 0,
    pendingOrders: 0,
    shippingOrders: 0,
    processingOrders: 0,
    onHoldOrders: 0,
    cancelledOrders: 0,
    refundedOrders: 0,
  };
  
  orderCounts.forEach(({ _id, count }) => {
    if (_id) {
      orderStats[`${_id}Orders`] = count;
    }
  });
  results.shippingCompanyCount = await shippingCompanyModel.countDocuments();  
  results.suppliersCount = await supplierModel.countDocuments();  
  results.customersCount = await customerModel.countDocuments();  
  results.usersCount = await userModel.countDocuments();  
  results = { ...results, ...orderStats };
}catch(err){
  return res.status(400).json({ message: err.message });
}
  res.json({ message: "Done", results });

});




export {
getAllStats
};
