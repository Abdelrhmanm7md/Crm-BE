import { productModel } from "../../../database/models/product.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import { photoUpload } from "../../utils/removeFiles.js";

const createProduct = catchAsync(async (req, res, next) => {
    req.body.store =  JSON.parse(req.body.store);
    let images = photoUpload(req, "images", "products");
    req.body.images = images.map((pic) => pic.replace(`http://localhost:8000/`, ""));
    let newProduct = new productModel(req.body);
    let addedProduct = await newProduct.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Product has been created successfully!",
      addedProduct,
    });
  });
  

const getAllProduct = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(productModel.find(), req.query)
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

 !Product && res.status(404).json({ message: "Product not found!" });


  res.status(200).json({ Product });
});
const updateProduct = catchAsync(async (req, res, next) => {
  let { id } = req.params;
let { name , unitPrice , desc , store , images } = req.body;
  let updatedProduct = await productModel.findByIdAndUpdate(id, { name , unitPrice , desc , store , images }, {
    new: true,
  });

  if (!updatedProduct) {
    return res.status(404).json({ message: "Couldn't update!  not found!" });
  }

  res
    .status(200)
    .json({ message: "Product updated successfully!", updatedProduct });
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
};
