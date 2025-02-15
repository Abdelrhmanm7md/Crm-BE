import { inventoryModel } from "../../../database/models/inventory.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createInventory = catchAsync(async (req, res, next) => {
    let newInventory = new inventoryModel(req.body);
    let addedInventory = await newInventory.save();
  
    res.status(201).json({
      message: "Inventory has been created successfully!",
      addedInventory,
    });
  });
  

const getAllInventory = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(inventoryModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
 !ApiFeat && res.status(404).json({ message: "No Inventory was found!" });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const getInventoryById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Inventory = await inventoryModel.findById(id);

 !Inventory && res.status(404).json({ message: "Inventory not found!" });


  res.status(200).json({ message: "Done", Inventory });
});
const updateInventory = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedInventory = await inventoryModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  if (!updatedInventory) {
    return res.status(404).json({ message: "Couldn't update!  not found!" });
  }

  res
    .status(200)
    .json({ message: "Inventory updated successfully!", updatedInventory });
});
const deleteInventory = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let deletedInventory = await inventoryModel.findByIdAndDelete({ _id: id });

  if (!deletedInventory) {
    return res.status(404).json({ message: "Couldn't delete!  not found!" });
  }

  res.status(200).json({ message: "Inventory deleted successfully!" });
});

export {
  createInventory,
  getAllInventory,
  getInventoryById,
  deleteInventory,
  updateInventory,
};
