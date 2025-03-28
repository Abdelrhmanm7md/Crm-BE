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

  let updatedInventory = await inventoryModel.findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );

  if (!updatedInventory) {
    return res.status(404).json({
      message: req.query.lang == "ar" ? "تعذر التحديث! غير موجود!" : "Couldn't update! Not found!",
    });
  }

  if (transferProduct) {
    transferProduct.mainStore = process.env.MAINBRANCH;
    const mainBranchId = new mongoose.Types.ObjectId(process.env.MAINBRANCH);

    let product = await productModel.findById(transferProduct.id);
    if (!product) {
      return res.status(404).json({ message: `Product not found: ${transferProduct.id}` });
    }

    const logs = [];

    for (const variant of transferProduct.ProductVariant) {
      const variantId = new mongoose.Types.ObjectId(variant.id);

      const mainBranchVariant = product.productVariations.find((v) => {
        return (
          v.branch.toString() === mainBranchId.toString() &&
          v.color === variant.color &&
          JSON.stringify(v.size) === JSON.stringify(variant.size)
        );
      });

      if (!mainBranchVariant || mainBranchVariant.quantity < variant.quantity) {
        return res.status(400).json({
          message: `Insufficient stock in MAINBRANCH. Available: ${
            mainBranchVariant ? mainBranchVariant.quantity : 0
          }, Requested: ${variant.quantity}`,
        });
      }

      mainBranchVariant.quantity -= variant.quantity;
      product.markModified("productVariations");
      await product.save();

      const targetBranchId = new mongoose.Types.ObjectId(variant.branch);

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

      // Add transfer details to inventory
      updatedInventory.transferProduct.push({
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
    await updatedInventory.save();
    return res.status(200).json({ message: "Product Transfer successfully", updatedInventory });
  }

  res.status(200).json({
    message: req.query.lang == "ar" ? "تم تحديث المخزون بنجاح!" : "Inventory updated successfully!",
    updatedInventory,
  });
});

const updateTransferProductQuantity = catchAsync(async (req, res, next) => {
  const { inventoryId, transferId } = req.params; // Inventory and TransferProduct IDs
  const { newQuantity } = req.body; // New quantity value

  if (!newQuantity || newQuantity <= 0) {
    return res.status(400).json({ message: "Invalid quantity value" });
  }

  const inventory = await inventoryModel.findById(inventoryId);
  if (!inventory) {
    return res.status(404).json({ message: "Inventory not found" });
  }

  const transferProduct = inventory.transferProduct.find(
    (tp) => tp._id.toString() === transferId
  );
  if (!transferProduct) {
    return res.status(404).json({ message: "Transfer product not found" });
  }

  const mainBranchId = transferProduct.fromBranch;
  const targetBranchId = transferProduct.toBranch;
  const product = await productModel.findById(transferProduct.product);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const mainBranchVariant = product.productVariations.find(
    (v) =>
      v.branch.toString() === mainBranchId.toString() &&
      v.color === transferProduct.color &&
      JSON.stringify(v.size) === JSON.stringify(transferProduct.size)
  );

  const targetBranchVariant = product.productVariations.find(
    (v) =>
      v.branch.toString() === targetBranchId.toString() &&
      v.color === transferProduct.color &&
      JSON.stringify(v.size) === JSON.stringify(transferProduct.size)
  );

  if (!mainBranchVariant || !targetBranchVariant) {
    return res.status(404).json({ message: "Product variant not found in branches" });
  }

  const quantityDiff = newQuantity - transferProduct.quantity;

  if (quantityDiff > 0 && mainBranchVariant.quantity < quantityDiff) {
    return res.status(400).json({
      message: `Insufficient stock in MAINBRANCH. Available: ${mainBranchVariant.quantity}, Requested: ${quantityDiff}`,
    });
  }

  // Adjust quantities
  mainBranchVariant.quantity -= quantityDiff;
  targetBranchVariant.quantity += quantityDiff;

  transferProduct.quantity = newQuantity;

  await product.markModified("productVariations");
  await product.save();
  await inventory.save();

  res.status(200).json({ message: "Transfer product quantity updated successfully", inventory });
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
  updateTransferProductQuantity,
};
