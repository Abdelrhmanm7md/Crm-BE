import { productModel } from "../../../database/models/product.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import { photoUpload, removeFile } from "../../utils/removeFiles.js";
import { supplierModel } from "../../../database/models/supplier.model.js";
import { branchModel } from "../../../database/models/branch.model.js";
import { categoryModel } from "../../../database/models/category.model.js";
import { brandModel } from "../../../database/models/brand.model.js";
import axios from "axios";
import cron from "node-cron";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const createProduct = catchAsync(async (req, res, next) => {
  req.body.store = JSON.parse(req.body.store);
  req.body.createdBy = req.user._id;
  // if (req.body.discountPercentage > 0) {
  //   req.body.discountPrice = req.body.sellingPrice - (req.body.sellingPrice * req.body.discountPercentage) / 100;
  // } else if (req.body.discountPrice > 0) {
  //   req.body.discountPercentage = ((req.body.sellingPrice - req.body.discountPrice) / req.body.sellingPrice) * 100;
  // } else {
  //   req.body.discountPrice = req.body.sellingPrice;
  //   req.body.discountPercentage = 0;
  // }
  // let gallery = photoUpload(req, "gallery", "products");
  // let pic = photoUpload(req, "pic", "products");
  // pic = pic[0].replace(`${process.env.HOST}`, "");
  // // http://147.93.89.1:8000/
  // req.body.pic = pic;
  // req.body.gallery = gallery.map((pic) =>
  //   pic.replace(`${process.env.HOST}`, "")
  // );
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

  res.json({
    message: "Done",
    page: ApiFeat.page,
    totalPages: ApiFeat.totalPages,
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
  let result = await productModel.find({ brand: { $in: [validBrandId] } }).lean();

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

  let result = await productModel.find({ store: { $elemMatch: { branch: branchId } } });
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
  if (!Product) {
    return res.status(404).json({ message: message_1 });
  }
Product = Product[0];
  res.status(200).json({ message: "Done", Product });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  // const {
  //   name,
  //   category,
  //   colors,
  //   description,
  //   shortDescription,
  //   brand,
  //   costPrice,
  //   store,
  //   sellingPrice,
  //   discountPrice,
  //   discountPercentage,
  //   suppliersToAdd,
  //   suppliersToRemove,
  // } = req.body;

  // const update = {
  //   name,
  //   category,
  //   colors,
  //   shortDescription,
  //   description,
  //   brand,
  //   costPrice,
  //   store,
  //   sellingPrice,
  //   discountPrice,
  //   discountPercentage,
  // };

  // if (suppliersToAdd && suppliersToAdd.length > 0) {
  //   update.$push = { suppliers: { $each: suppliersToAdd } };
  // }

  // if (suppliersToRemove && suppliersToRemove.length > 0) {
  //   update.$pull = { suppliers: { $in: suppliersToRemove } };
  // }

  // const updatedProduct = await productModel.findByIdAndUpdate(id, update, {new: true,});
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
// const updatePhotos = catchAsync(async (req, res, next) => {
//   const { id } = req.params;
//   let { indicesToRemove } = req.body;

//   indicesToRemove = Array.isArray(indicesToRemove)
//     ? indicesToRemove.map(Number).filter((i) => !isNaN(i))
//     : [Number(indicesToRemove)].filter((i) => !isNaN(i));

//   let check = await productModel.findById(id);
//   let err_1 = "product not found!";
//   let err_2 = "Couldn't update! Invalid indices!";
//   let message = "Product files updated successfully!";
//   let updates = {};
//   let updatedPhotos = {};
//   let pic = null;

//   // Language localization
//   if (req.query.lang === "ar") {
//     err_1 = "المنتج غير موجود";
//     err_2 = "لم يتم التحديث! البيانات غير صحيحة!";
//     message = "تم تحديث ملفات المنتج بنجاح!";
//   }

//   if (!check) {
//     return res.status(404).json({ message: err_1 });
//   }

//   // Handling 'pic' upload logic
//   if (check.pic === undefined) {
//     pic = photoUpload(req, "pic", "products");
//     pic = pic[0]?.replace(`${process.env.HOST}`, "");
//   }

//   if (check.pic !== undefined && req.files && req.files.pic) {
//     // Remove old file if a new one is being uploaded
//     removeFile("products", check.pic);
//     pic = photoUpload(req, "pic", "products");
//     pic = pic[0]?.replace(`${process.env.HOST}`, "");
//   }

//   if (pic) {
//     updates.pic = pic; // Update the product's 'pic' field
//   }

//   // Handle gallery file removal
//   if (
//     indicesToRemove &&
//     Array.isArray(indicesToRemove) &&
//     indicesToRemove.length > 0
//   ) {
//     const gallery = check.gallery;

//     const validIndices = indicesToRemove.filter(
//       (i) => i >= 0 && i < gallery.length
//     );

//     if (validIndices.length === 0) {
//       return res.status(400).json({ message: err_2 });
//     }

//     // Remove files from the server
//     validIndices.forEach((index) => {
//       const fileToRemove = gallery[index];
//       console.log(
//         `Attempting to remove file at index ${index}: ${fileToRemove}`
//       );
//       if (fileToRemove) {
//         try {
//           removeFile("products", fileToRemove); // Remove the file from server storage
//           console.log(`✅ Successfully removed: ${fileToRemove}`);
//         } catch (error) {
//           console.error(`❌ Failed to remove file: ${fileToRemove}`, error);
//         }
//       }
//     });

//     // Update the gallery array after removal
//     const updatedGallery = gallery.filter(
//       (_, index) => !validIndices.includes(index)
//     );
//     updates.gallery = updatedGallery;
//   }

//   if (req.files && req.files.gallery) {
//     let newGalleryPhotos = photoUpload(req, "gallery", "products");

//     newGalleryPhotos = Array.isArray(newGalleryPhotos)
//       ? newGalleryPhotos
//       : [newGalleryPhotos];
//     newGalleryPhotos = newGalleryPhotos.map((file) =>
//       file.replace(`${process.env.HOST}`, "")
//     );

//     if (newGalleryPhotos.length > 0) {
//       updates.gallery = [
//         ...(updates.gallery || check.gallery),
//         ...newGalleryPhotos,
//       ];
//     }
//   }

//   // Update the product in the database
//   updatedPhotos = await productModel.findByIdAndUpdate(id, updates, {
//     new: true,
//     runValidators: true,
//   });

//   // Return updated product data
//   res.status(200).json({ message: message, updatedPhotos });
// });

const deleteProduct = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let product = await productModel.findById(id);
  let message_1 = "Couldn't delete! Not found!";
  let message_2 = "Product deleted successfully!";
  if (req.query.lang == "ar") {
    message_1 = "لم يتم الحذف! غير موجود!";
    message_2 = "تم حذف المنتج بنجاح!";
  }
  if (!product) {
    return res.status(404).json({ message: message_1 });
  }

  product.userId = req.userId;
  await product.deleteOne();

  res.status(200).json({ message: message_2 });
});

// ✅ Fetch & Update Products
const fetchAndStoreProducts = async () => {
  try {
    console.log("⏳ Fetching products from WooCommerce API...");
    const { data } = await axios.get(
      "https://a2mstore.com/wp-json/wc/v3/products",
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

    for (const item of data) {
      const productSKU = item.sku ? item.sku.toLowerCase() : `WP-${item.id}`;

      const categoryIds = await Promise.all(
        item.categories.map(async (cat) => {
          const existingCategory = await categoryModel.findOneAndUpdate(
            { name: cat.name }, // Find by name
            {
              $setOnInsert: {
                slug: cat.slug,
                createdBy: `${process.env.WEBSITEADMIN}`,
                SKU: `WP-${cat.id}`,
              },
            },
            { new: true, upsert: true } // Create if not found
          );
          return existingCategory._id;
        })
      );

      const brandIds = await Promise.all(
        item.brands.map(async (brand) => {
          const existingBrand = await brandModel.findOneAndUpdate(
            { name: brand.name }, // Find by name
            {
              $setOnInsert: {
                slug: brand.slug,
                createdBy: `${process.env.WEBSITEADMIN}`,
                SKU: `WP-${brand.id}`,
              },
            },
            { new: true, upsert: true } // Create if not found
          );
          return existingBrand._id;
        })
      );

      const existingProduct = await productModel.findOne({ SKU: productSKU });
      const attributeName = "costPrice"; 
      const attribute = item.attributes.find(attr => attr.name === attributeName);
      // 🔹 Product Data
      const productData = {
        name: item.name,
        wordPressId: item.id,
        SKU: productSKU,
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
        // store: [
        //   {
        //     branch: new mongoose.Types.ObjectId(process.env.WEBSITEBRANCHID),
        //     quantity:
        //       item.stock_status === "instock" &&
        //       typeof item.stock_quantity === "number"
        //         ? item.stock_quantity
        //         : 0,
        //   },
        // ],
        createdBy: `${process.env.WEBSITEADMIN}`,
        costPrice: attribute 
        ? parseFloat(attribute.options[0]) || 0 // Convert to number, default to 0 if NaN
        : 0,
        sellingPrice: parseFloat(item.price) || 0,
        salePrice: parseFloat(item.sale_price) || null,
        // discountPrice: parseFloat(item.sale_price) || 0,
        // discountPercentage: item.regular_price
        //   ? ((item.regular_price - item.sale_price) / item.regular_price) * 100
        //   : 0,
      };

      const storeEntry = {
        branch: new mongoose.Types.ObjectId(process.env.WEBSITEBRANCHID),
        quantity:
          item.stock_status === "instock" && typeof item.stock_quantity === "number"
            ? item.stock_quantity
            : 0,
      };
      // 🔹 Update Product if Exists, Else Create
      if (existingProduct) {
        await productModel.findByIdAndUpdate(existingProduct._id,{
          $set: productData, // Update existing fields
          $push: { store: storeEntry }, // Push to store array
        }, {
          userId: `${process.env.WEBSITEADMIN}`,
          context: { query: {} },
        });
        console.log(`✅ Updated Product: ${item.name}`);
      } else {
        await productModel.create({
          ...productData,
          store: [storeEntry], // Initialize store array with storeEntry
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
cron.schedule("0 */6 * * *", () => {
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
  deleteProduct,
  updateProduct,
  // updatePhotos,
  fetchAllProducts,
};
