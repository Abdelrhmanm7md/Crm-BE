import { branchModel } from "../../../database/models/branch.model.js";
import { inventoryModel } from "../../../database/models/inventory.model.js";
import { productModel } from "../../../database/models/product.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

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
  transferProduct = {
    id:1, 
    mainStore :20, 
    ProductVariant:[
          {
            costPrice:120 ,
            regularPrice:122,
            salePrice:122 ,
            quantity:5,
            photo:"ddd.jpg",
            color: "red",
            size:["s"] ,
            weight:11,
            dimensions: {
              length: 1,
              width:1 ,
              height: 1,
            },
            branch: "ddd",
          },
        ],
    }

    if (transferProduct) {
      // Step 1: Fetch the product
      let product = await productModel.findOne(
        {
          _id: transferProduct.id,
          "productVariations.branch": { $in: transferProduct.ProductVariant.map(v => v.branch) }
        },
        {
          "productVariations.quantity": 1, // Only fetch the quantity field
          "productVariations.branch": 1
        }
      );
    
      if (!product) {
        return res.status(404).json({ message: `Product not found ${transferProduct.id}` });
      }
    
      // Step 2: Check if requested quantity is available
      for (const variant of transferProduct.ProductVariant) {
        let matchedVariant = product.productVariations.find(v =>
          v.branch.toString() === variant.branch
        );
    
        if (!matchedVariant || matchedVariant.quantity < variant.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for branch ${variant.branch}. Available: ${matchedVariant ? matchedVariant.quantity : 0}, Requested: ${variant.quantity}`
          });
        }
      }
    
      // Step 3: Proceed with updating the product
      let updatedProduct = await productModel.findOneAndUpdate(
        {
          _id: transferProduct.id,
          "productVariations.branch": { $in: transferProduct.ProductVariant.map(v => v.branch) }
        },
        {
          $inc: {
            "productVariations.$.quantity": -transferProduct.ProductVariant[0].quantity, // Decrease the existing stock
            quantity: transferProduct.mainStore // Update main product quantity
          }
        },
        { new: true, userId: req.userId, context: { query: req.query } }
      );
    
      // If no matching branch was found, push a new variation
      if (!updatedProduct) {
        const newVariations = transferProduct.ProductVariant.map(variant => ({
          branch: variant.branch,
          quantity: variant.quantity,
          costPrice: variant.costPrice || null,
          sellingPrice: variant.regularPrice || null,
          salePrice: variant.salePrice || null,
          photo: variant.photo || "",
          color: variant.color || "",
          size: variant.size || [],
          weight: variant.weight || "",
          dimensions: variant.dimensions || { length: "", width: "", height: "" },
        }));
    
        updatedProduct = await productModel.findByIdAndUpdate(
          transferProduct.id,
          {
            $push: { productVariations: { $each: newVariations } }, // Push all new variations
          },
          { new: true, userId: req.userId, context: { query: req.query } }
        );
      }
    
    
      return res.status(200).json({ message: "Product updated successfully" });
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
