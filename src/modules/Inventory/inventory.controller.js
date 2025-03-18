import { inventoryModel } from "../../../database/models/inventory.model.js";
import { productModel } from "../../../database/models/product.model.js";
import { productLogsModel } from "../../../database/models/productTransferLog.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import mongoose from "mongoose";

const createInventory = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  let newInventory = new inventoryModel(req.body);
  let addedInventory = await newInventory.save({
    context: { query: req.query },
  });

  res.status(201).json({
    message: "Inventory has been created successfully!",
    addedInventory,
  });
});

const getAllInventory = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(inventoryModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });
});

const getInventoryById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Inventory = await inventoryModel.find({ _id: id });
  let message_1 = "No Inventory was found!";
  if (req.query.lang == "ar") {
    message_1 = "لم يتم العثور على مخزن!";
  }
  if (!Inventory || Inventory.length === 0) {
    return res.status(404).json({ message: message_1 });
  }
  Inventory = JSON.parse(JSON.stringify(Inventory));
  Inventory = Inventory[0];

  res.status(200).json({ message: "Done", Inventory });
});
const updateInventory = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let { transferProduct } = req.body;
  let updatedInventory = await inventoryModel.findByIdAndUpdate(id, req.body, {
    new: true,
    userId: req.userId,
    context: { query: req.query },
  });

  if (transferProduct) {
    transferProduct.mainStore = process.env.MAINBRANCH;
    const mainBranchId = new mongoose.Types.ObjectId(process.env.MAINBRANCH);
    console.log("Main Branch ID:", mainBranchId.toString());
  
    let product = await productModel.findById(transferProduct.id);
    if (!product) {
      return res.status(404).json({ message: `Product not found: ${transferProduct.id}` });
    }
  
    const logs = [];
  
    for (const variant of transferProduct.ProductVariant) {
      console.log("Checking variant:", variant);
      const variantId = new mongoose.Types.ObjectId(variant.id);
      console.log("Variant ID (Converted):", variantId.toString());
  
      console.log("Looking for a match in MAINBRANCH...");
  
      const mainBranchVariant = product.productVariations.find((v) => {
        console.log(`Checking variation: branch=${v.branch.toString()}, color=${v.color}, size=${JSON.stringify(v.size)}`);
        return (
          v.branch.toString() === mainBranchId.toString() &&
          v.color === variant.color &&
          JSON.stringify(v.size) === JSON.stringify(variant.size)
        );
      });
  
      console.log("Found Main Branch Variant:", mainBranchVariant);
  
      if (!mainBranchVariant || mainBranchVariant.quantity < variant.quantity) {
        console.log(
          `Insufficient stock in MAINBRANCH. Available: ${mainBranchVariant?.quantity || 0}, Requested: ${variant.quantity}`
        );
  
        return res.status(400).json({
          message: `Insufficient stock in MAINBRANCH. Available: ${
            mainBranchVariant ? mainBranchVariant.quantity : 0
          }, Requested: ${variant.quantity}`,
        });
      }
  
// Deduct quantity from the main branch
mainBranchVariant.quantity -= variant.quantity;
console.log(`Updated Main Branch Quantity: ${mainBranchVariant.quantity}`);

product.markModified("productVariations");
console.log("Marked productVariations as modified.");

// Save the product
try {
  await product.save();
  console.log("Product saved successfully.");
} catch (err) {
  console.error("Error saving product:", err);
}

  
      // Convert target branch to ObjectId
      const targetBranchId = new mongoose.Types.ObjectId(variant.branch);
      console.log("Target Branch ID:", targetBranchId.toString());
  
      // Find or create variant in the target branch
      let targetBranchVariant = product.productVariations.find((v) => {
        return (
          v.branch.toString() === targetBranchId.toString() &&
          v.color === variant.color &&
          JSON.stringify(v.size) === JSON.stringify(variant.size)
        );
      });
  
      if (targetBranchVariant) {
        targetBranchVariant.quantity += variant.quantity;
      } else {
        product.productVariations.push({
          costPrice: variant.costPrice,
          sellingPrice: variant.sellingPrice,
          salePrice: variant.salePrice,
          quantity: variant.quantity,
          photo: variant.photo,
          color: variant.color,
          size: variant.size,
          weight: variant.weight,
          dimensions: variant.dimensions,
          branch: targetBranchId,
        });
      }
  
      logs.push({
        product: transferProduct.id,
        fromBranch: mainBranchId,
        toBranch: targetBranchId,
        quantity: variant.quantity,
        costPrice: variant.costPrice,
        sellingPrice: variant.sellingPrice,
        salePrice: variant.salePrice,
        color: variant.color,
        size: variant.size,
        weight: variant.weight,
        dimensions: variant.dimensions,
        transferredBy: req.userId,
      });
    }
  
    await productLogsModel.insertMany(logs);
    
    await product.save()
  
    return res.status(200).json({ message: "Product Transfer successfully" });
  }
    

  let message_1 = "Couldn't update!  not found!";
  let message_2 = "Inventory updated successfully!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر التحديث! غير موجود!";
    message_2 = "تم تحديث العميل بنجاح!";
  }
  if (!updatedInventory) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: message_2, updatedInventory });
});
const deleteInventory = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  // Find the Inventory first
  let Inventory = await inventoryModel.findById(id);
  let message_1 = "Couldn't delete! Not found!";
  let message_2 = "Inventory deleted successfully!";
  if (req.query.lang == "ar") {
    message_1 = "لم يتم الحذف! غير موجود!";
    message_2 = "تم حذف العميل بنجاح!";
  }
  if (!Inventory) {
    return res.status(404).json({ message: message_1 });
  }

  Inventory.userId = req.userId;
  await Inventory.deleteOne();

  res.status(200).json({ message: message_2 });
});

export {
  createInventory,
  getAllInventory,
  getInventoryById,
  deleteInventory,
  updateInventory,
};
