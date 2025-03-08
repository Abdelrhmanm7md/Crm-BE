import { productModel } from "../../../database/models/product.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import { supplierModel } from "../../../database/models/supplier.model.js";
import { branchModel } from "../../../database/models/branch.model.js";
import { categoryModel } from "../../../database/models/category.model.js";
import { brandModel } from "../../../database/models/brand.model.js";
import axios from "axios";
import cron from "node-cron";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { logModel } from "../../../database/models/log.model.js";
dotenv.config();

const createProduct = catchAsync(async (req, res, next) => {
  req.body.store = JSON.parse(req.body.store);
  req.body.createdBy = req.user._id;
  let newProduct = new productModel(req.body);
  let addedProduct = await newProduct.save({ context: { query: req.query } });

  res.status(201).json({
    message: "Product has been created successfully!",
    addedProduct,
  });
});

const getAllProduct = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(productModel.find(), req.query);
  await ApiFeat.pagination(); // Ensure pagination waits for total count

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    
    results = results.filter(function (item) {
      if(item.supplierOrderAt == null){
        return new Date(item.createdAt) >= new Date(startDate) && new Date(item.createdAt).setHours(23, 59, 59, 999) <= new Date(endDate);
      }else{
        return new Date(item.supplierOrderAt) >= new Date(startDate) && new Date(item.supplierOrderAt).setHours(23, 59, 59, 999) <= new Date(endDate);
      }
    });
  }
  res.json({
    message: "Done",
    page: ApiFeat.page,
    totalPages: ApiFeat.totalPages,
    results,
  });
});

const exportProducts = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(productModel.find(), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });

});
const getAllProductsBySupplier = catchAsync(async (req, res, next) => {
  let { supplierId } = req.params;
  let message_1 = "No Products was found!";
  let message_2 = "Supplier not found!";
  if (req.query.lang == "ar") {
    message_1 = "لا يوجد منتجات!";
    message_2 = "المورد غير موجود!";
  }
  let check = await supplierModel.findById(supplierId);
  if (!check) {
    return res.status(404).json({ message: message_2 });
  }
  let result = await productModel.find({ supplier: supplierId });
  if (!result || result.length === 0) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: "Done", result });
});
const getAllProductsByBrand = catchAsync(async (req, res, next) => {
  let { brandId } = req.params;
  let message_2 = "brand not found!";
  if (req.query.lang == "ar") {
    message_2 = "الماركة غير موجود!";
  }

  const validBrandId = new mongoose.Types.ObjectId(brandId);
  let check = await brandModel.findById(validBrandId);
  if (!check) {
    return res.status(404).json({ message: message_2 });
  }
  let result = await productModel
    .find({ brand: { $in: [validBrandId] } })
    .lean();

  res.status(200).json({ message: "Done", result });
});
const getAllProductsByBranch = catchAsync(async (req, res, next) => {
  let { branchId } = req.params;
  let message_1 = "No Products was found!";
  let message_2 = "branch not found!";
  if (req.query.lang == "ar") {
    message_1 = "لا يوجد منتجات!";
    message_2 = "الفرع غير موجود!";
  }
  let check = await branchModel.findById(branchId);
  if (!check) {
    return res.status(404).json({ message: message_2 });
  }

  let result = await productModel.find({
    store: { $elemMatch: { branch: branchId } },
  });
  if (!result || result.length === 0) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: "Done", result });
});

const getAllProductsByCategory = catchAsync(async (req, res, next) => {
  let { categoryId } = req.params;
  let message_1 = "No Products was found!";
  let message_2 = "category not found!";
  if (req.query.lang == "ar") {
    message_1 = "لا يوجد منتجات!";
    message_2 = "القسم غير موجود!";
  }
  let check = await categoryModel.findById(categoryId);
  if (!check) {
    return res.status(404).json({ message: message_2 });
  }

  let result = await productModel.find({ category: { $in: [categoryId] } });
  if (!result || result.length === 0) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: "Done", result });
});

const getProductById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Product = await productModel.find({ _id: id });
  let message_1 = "Product not found!";
  if (req.query.lang == "ar") {
    message_1 = "المنتج غير موجود";
  }
  if (!Product || Product.length === 0) {
    return res.status(404).json({ message: message_1 });
  }
  Product = JSON.parse(JSON.stringify(Product));
  Product = Product[0];
  res.status(200).json({ message: "Done", Product });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const updatedProduct = await productModel.findByIdAndUpdate(id, req.body, {
    new: true,
    userId: req.userId,
    context: { query: req.query },
  });
  let message_1 = "Couldn't update!  not found!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر التحديث! غير موجود!";
  }
  if (!updatedProduct) {
    return res.status(404).json({ message: message_1 });
  }

  res
    .status(200)
    .json({ message: "Product updated successfully!", updatedProduct });
});
const updateProductsBulk = catchAsync(async (req, res, next) => {
  const { updates } = req.body; // Array of updates
  const userId = req.userId; // Get userId from query

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: "Invalid updates array!" });
  }

  // 1️⃣ Fetch all products before updating (to log previous values)
  const productIds = updates.map((update) => update.id);
  const beforeUpdates = await productModel.find({ _id: { $in: productIds } }).lean();

  // Create a Map to easily access old data by product ID
  const beforeUpdateMap = new Map(beforeUpdates.map((doc) => [doc._id.toString(), doc]));

  // 2️⃣ Build bulkWrite operations
  const bulkOps = updates.map((update) => ({
    updateOne: {
      filter: { _id: update.id }, // Match specific product
      update: { $set: { ...update.fields, updatedBy: userId } } // Apply updates
    }
  }));

  // 3️⃣ Apply bulk updates
  const result = await productModel.bulkWrite(bulkOps);

  // 4️⃣ Log changes
  const logs = updates.map((update) => {
    const before = beforeUpdateMap.get(update.id); // Get previous data
    return {
      user: userId,
      action: "update product",
      targetModel: "Product",
      targetId: update.id,
      before,
      after: update.fields,
    };
  });

  if (logs.length > 0) {
    await logModel.insertMany(logs); // Insert logs in bulk
  }

  let message_1 = "Couldn't update! Products not found!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر التحديث! المنتجات غير موجودة!";
  }

  if (result.modifiedCount === 0) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: "Products updated successfully!", result });
});

const deleteProducts = catchAsync(async (req, res, next) => {
  const { ids } = req.body; // Expecting an array of product IDs
  const userId = req.userId; // Get userId from query

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Invalid product IDs!" });
  }

  // 1️⃣ Fetch products before deleting (for logging)
  const products = await productModel.find({ _id: { $in: ids } }).lean();

  if (products.length === 0) {
    let message_1 = req.query.lang == "ar" ? "لم يتم الحذف! غير موجود!" : "Couldn't delete! Not found!";
    return res.status(404).json({ message: message_1 });
  }

  // 2️⃣ Delete products in bulk
  const result = await productModel.deleteMany({ _id: { $in: ids } });

  // 3️⃣ Log deleted products
  const logs = products.map((product) => ({
    user: userId,
    action: "delete product",
    targetModel: "Product",
    targetId: product._id,
    before: product, // Store deleted product details
  }));

  if (logs.length > 0) {
    await logModel.insertMany(logs); // Save logs in bulk
  }

  let message_2 = req.query.lang == "ar" ? "تم حذف المنتجات بنجاح!" : "Products deleted successfully!";

  res.status(200).json({ message: message_2, deletedCount: result.deletedCount });
});


// ✅ Fetch & Update Products
const fetchAndStoreProducts = async () => {
  try {
    let page = 1;
    let allProducts = [];
    let totalFetched = 0;

    do {
      const { data } = await axios.get(
        "https://a2mstore.com/wp-json/wc/v3/products",
        {
          params: {
            per_page: 100,
            page: page,
          },
          auth: {
            username: process.env.CONSUMERKEY,
            password: process.env.CONSUMERSECRET,
          },
          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                `${process.env.CONSUMERKEY}:${process.env.CONSUMERSECRET}`
              ).toString("base64"),
            "Content-Type": "application/json",
          },
        }
      );

      totalFetched = data.length;
      allProducts.push(...data);
      page++;
    } while (totalFetched > 0);

    console.log(`✅ Fetched ${allProducts.length} products from WooCommerce`);

    for (const item of allProducts) {
      const productSKU = item.id.toString();

      // Fetch Product Variations if the product is a variable product
      let productVariations = [];
      if (item.type === "variable") {
        const { data: variations } = await axios.get(
          `https://a2mstore.com/wp-json/wc/v3/products/${item.id}/variations`,
          {
            auth: {
              username: process.env.CONSUMERKEY,
              password: process.env.CONSUMERSECRET,
            },
            headers: {
              Authorization:
                "Basic " +
                Buffer.from(
                  `${process.env.CONSUMERKEY}:${process.env.CONSUMERSECRET}`
                ).toString("base64"),
              "Content-Type": "application/json",
            },
          }
        );
        const attributeName = "costPrice";
        const attribute1 = item.attributes.find((attr) => attr.name === attributeName);
        
        productVariations = variations.map((variation) => ({
          
          quantity:
            variation.stock_status === "instock" &&
            typeof variation.stock_quantity === "number"
              ? variation.stock_quantity
              : 0,
          photo: variation.image ? variation.image.src : undefined,
          color:
            variation.attributes.find((attr) => attr.name.toLowerCase() === "color")?.option ||
            "",
          size: variation.attributes
            .filter((attr) => attr.name.toLowerCase() === "size")
            .map((attr) => attr.option),
            branch: process.env.WEBSITEBRANCHID,
          weight: variation.weight,
          dimensions: variation.dimensions,
          regularPrice: variation.regular_price,
          salePrice: variation.sale_price,
          costPrice :attribute1 ? parseFloat(attribute1.options[0]) || 0 : 0,
        }));
      }
      // Fetch categories
      const categoryIds = await Promise.all(
        item.categories.map(async (cat) => {
          const existingCategory = await categoryModel.findOneAndUpdate(
            { wordPressId: cat.id },
            {
              $setOnInsert: {
                name: cat.name,
                slug: cat.slug,
                createdBy: `${process.env.WEBSITEADMIN}`,
                SKU: `WP-${cat.id}`,
              },
            },
            { new: true, upsert: true }
          );
          return existingCategory._id;
        })
      );

      // Fetch brands
      const brandIds = await Promise.all(
        item.brands.map(async (brand) => {
          const existingBrand = await brandModel.findOneAndUpdate(
            { wordPressId: brand.id },
            {
              $setOnInsert: {
                name: brand.name,
                slug: brand.slug,
                createdBy: `${process.env.WEBSITEADMIN}`,
                SKU: `WP-${brand.id}`,
              },
            },
            { new: true, upsert: true }
          );
          return existingBrand._id;
        })
      );

      const existingProduct = await productModel.findOne({ wordPressId: productSKU });

      const attributeName = "costPrice";
      const attribute = item.attributes.find((attr) => attr.name === attributeName);
      const productData = {
        name: item.name,
        wordPressId: item.id.toString(),
        SKU: item.SKU || `WP-${item.id}`,
        shortDescription: item.short_description || "",
        description: item.description || "",
        brand: brandIds,
        category: categoryIds,
        attributes: item.attributes.map((attr) => ({
          name: attr.name,
          value: attr.options.join(", "),
        })),
        pic: item.images.length > 0 ? item.images[0].src : undefined,
        gallery: item.images.map((img) => img.src),
        createdBy: `${process.env.WEBSITEADMIN}`,
        costPrice: attribute ? parseFloat(attribute.options[0]) || 0 : 0,
        sellingPrice: parseFloat(item.price) || 0,
        salePrice: parseFloat(item.sale_price) || null,
        fromWordPress: true,
        productVariations: productVariations,
      };

      const storeEntry = {
        branch: new mongoose.Types.ObjectId(process.env.WEBSITEBRANCHID),
        quantity:
          item.stock_status === "instock" &&
          typeof item.stock_quantity === "number"
            ? item.stock_quantity
            : 0,
      };

      // Update or create product
      if (existingProduct) {
        await productModel
          .findOneAndUpdate(
            { _id: existingProduct._id, "store.branch": storeEntry.branch },
            {
              $set: {
                "store.$.quantity": storeEntry.quantity,
                productVariations: productVariations,
              },
            },
            {
              new: true,
              userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
            }
          )
          .then(async (result) => {
            if (!result) {
              await productModel.findOneAndUpdate(
                { _id: existingProduct._id },
                { $push: { store: storeEntry }, productVariations },
                {
                  new: true,
                  userId: new mongoose.Types.ObjectId(`${process.env.WEBSITEADMIN}`),
                }
              );
            }
          });
        console.log(`✅ Updated Product: ${item.name}`);
      } else {
        await productModel.create({
          ...productData,
          store: [storeEntry],
        });
        console.log(`✅ Created Product: ${item.name}`);
      }
    }
    console.log("✅ Products updated successfully!");
  } catch (error) {
    console.error("❌ Error fetching products:", error.message);
  }
};

// ✅ Schedule the function to run every 6 hours
cron.schedule("* * * * *", () => {
  console.log("🔄 Running scheduled product update...");
  fetchAndStoreProducts();
});
const fetchAllProducts = catchAsync(async (req, res, next) => {
  fetchAndStoreProducts();

  res.json({
    message: "Done",
  });
});
fetchAndStoreProducts();

export {
  createProduct,
  getAllProduct,
  getAllProductsBySupplier,
  getAllProductsByBrand,
  getAllProductsByCategory,
  getAllProductsByBranch,
  getProductById,
  deleteProducts,
  updateProduct,
  updateProductsBulk,
  fetchAllProducts,
  exportProducts,
};
