import { orderModel } from "../../../database/models/order.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createOrder = catchAsync(async (req, res, next) => {
    let newOrder = new orderModel(req.body);
    let addedOrder = await newOrder.save();
  
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
  !ApiFeat && res.status(404).json({ message: "No Order was found!" });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const getOrderById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Order = await orderModel.findById(id);

 !Order && res.status(404).json({ message: "Order not found!" });


  res.status(200).json({ message: "Done", Order });
});
const updateOrder = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedOrder = await orderModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  if (!updatedOrder) {
    return res.status(404).json({ message: "Couldn't update!  not found!" });
  }

  res
    .status(200)
    .json({ message: "Order updated successfully!", updatedOrder });
});
const deleteOrder = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let deletedOrder = await orderModel.findByIdAndDelete({ _id: id });

  if (!deletedOrder) {
    return res.status(404).json({ message: "Couldn't delete!  not found!" });
  }

  res.status(200).json({ message: "Order deleted successfully!" });
});

export {
  createOrder,
  getAllOrder,
  getOrderById,
  deleteOrder,
  updateOrder,
};
