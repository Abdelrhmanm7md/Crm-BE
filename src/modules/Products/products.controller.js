import { productModel } from "../../../database/models/product.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import { photoUpload, removeFile } from "../../utils/removeFiles.js";

const createProduct = catchAsync(async (req, res, next) => {
  req.body.store = JSON.parse(req.body.store);
  let gallery = photoUpload(req, "gallery", "products");
  let pic = photoUpload(req, "pic", "products");
  pic = pic[0].replace(`http://localhost:8000/`, "");
  // http://147.93.89.1:8000/
  req.body.pic = pic;
  req.body.gallery = gallery.map((pic) =>
    pic.replace(`http://localhost:8000/`, "")
  );
  let newProduct = new productModel(req.body);
  let addedProduct = await newProduct.save({ context: { query: req.query } });

  res.status(201).json({
    message: "Product has been created successfully!",
    addedProduct,
  });
});

const getAllProduct = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(productModel.find(), req.query);
  // .pagination()
  // .filter()
  // .sort()
  // .search()
  // .fields();
  !ApiFeat && res.status(404).json({ message: "No Product was found!" });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });
});

const getProductById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Product = await productModel.findById(id);

  if (!Product) {
    return res.status(404).json({ message: "Product not found!" });
  }

  res.status(200).json({ message: "Done", Product });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, category, colors,description,shortDescription,brand,costPrice,store,sellingPrice,discountPrice,discountPercentage,suppliersToAdd, suppliersToRemove  } = req.body;

  const update = { name, category ,colors,shortDescription ,description ,brand,costPrice,store,sellingPrice,discountPrice,discountPercentage };

  if (suppliersToAdd && suppliersToAdd.length > 0) {
    update.$push = { suppliers: { $each: suppliersToAdd } };
  }

  if (suppliersToRemove && suppliersToRemove.length > 0) {
    update.$pull = { suppliers: { $in: suppliersToRemove } };
  }

  const updatedProduct = await productModel.findByIdAndUpdate(id, update, { new: true });

  if (!updatedProduct) {
    return res
      .status(404)
      .json({ message: "Couldn't update! Product not found!" });
  }

  res
    .status(200)
    .json({ message: "Product updated successfully!", updatedProduct });
});
const updatePhotos = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let { indicesToRemove } = req.body;

  indicesToRemove = Array.isArray(indicesToRemove)
    ? indicesToRemove.map(Number).filter(i => !isNaN(i))
    : [Number(indicesToRemove)].filter(i => !isNaN(i));

  let check = await productModel.findById(id);
  let err_1 = "product not found!";
  let err_2 = "Couldn't update! Invalid indices!";
  let message = "Product files updated successfully!";
  let updates = {};
  let updatedPhotos = {};
  let pic = null;

  // Language localization
  if (req.query.lang === "ar") {
    err_1 = "المنتج غير موجود";
    err_2 = "لم يتم التحديث! البيانات غير صحيحة!";
    message = "تم تحديث ملفات المنتج بنجاح!";
  }

  if (!check) {
    return res.status(404).json({ message: err_1 });
  }

  // Handling 'pic' upload logic
  if (check.pic === undefined) {
    pic = photoUpload(req, "pic", "products");
    pic = pic[0]?.replace(`http://localhost:8000/`, "");
  }

  if (check.pic !== undefined && req.files && req.files.pic) {
    // Remove old file if a new one is being uploaded
    removeFile("products", check.pic);
    pic = photoUpload(req, "pic", "products");
    pic = pic[0]?.replace(`http://localhost:8000/`, "");
  }

  if (pic) {
    updates.pic = pic; // Update the product's 'pic' field
  }

  // Handle gallery file removal
  if (indicesToRemove && Array.isArray(indicesToRemove) && indicesToRemove.length > 0) {
    const gallery = check.gallery;

    const validIndices = indicesToRemove.filter((i) => i >= 0 && i < gallery.length);


    if (validIndices.length === 0) {
      return res.status(400).json({ message: err_2 });
    }

    // Remove files from the server
    validIndices.forEach((index) => {
      const fileToRemove = gallery[index];
      console.log(`Attempting to remove file at index ${index}: ${fileToRemove}`);
      if (fileToRemove) {
        try {
          removeFile("products", fileToRemove);  // Remove the file from server storage
          console.log(`✅ Successfully removed: ${fileToRemove}`);
        } catch (error) {
          console.error(`❌ Failed to remove file: ${fileToRemove}`, error);
        }
      }
    });

    // Update the gallery array after removal
    const updatedGallery = gallery.filter((_, index) => !validIndices.includes(index));
    updates.gallery = updatedGallery;
  }

  if (req.files && req.files.gallery) {
    let newGalleryPhotos = photoUpload(req, "gallery", "products");
    
    newGalleryPhotos = Array.isArray(newGalleryPhotos) ? newGalleryPhotos : [newGalleryPhotos];
    newGalleryPhotos = newGalleryPhotos.map((file) => file.replace(`http://localhost:8000/`, ""));

    if (newGalleryPhotos.length > 0) {
      updates.gallery = [
        ...(updates.gallery || check.gallery),
        ...newGalleryPhotos,
      ];
    }
  }

  // Update the product in the database
  updatedPhotos = await productModel.findByIdAndUpdate(id, updates, {
    new: true, runValidators: true,
  });

  // Return updated product data
  res.status(200).json({ message: message, updatedPhotos });
});


const deleteProduct = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let deletedProduct = await productModel.findByIdAndDelete({ _id: id });

  if (!deletedProduct) {
    return res.status(404).json({ message: "Couldn't delete!  not found!" });
  }

  res.status(200).json({ message: "Product deleted successfully!" });
});

export {
  createProduct,
  getAllProduct,
  getProductById,
  deleteProduct,
  updateProduct,
  updatePhotos,
};
