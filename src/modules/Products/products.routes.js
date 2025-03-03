import express from "express";
const productRouter = express.Router();

import * as productController from "./products.controller.js";
import { fileSizeLimitErrorHandler, uploadMixFile, } from "../../utils/middleWare/fileUploads.js";
import { protectRoutes } from "../auth/auth.controller.js";

productRouter.post(
  "/",protectRoutes,
  uploadMixFile("products", [{ name: "gallery" }, { name: "pic" }]),
  fileSizeLimitErrorHandler,
  productController.createProduct
);
productRouter.get("/",protectRoutes, productController.getAllProduct);
productRouter.get("/category/:categoryId",protectRoutes, productController.getAllProductsByCategory);
productRouter.get("/brand/:brandId",protectRoutes, productController.getAllProductsByBrand);
productRouter.get("/branch/:branchId",protectRoutes, productController.getAllProductsByBranch);
productRouter.get("/supplier/:supplierId",protectRoutes, productController.getAllProductsBySupplier);
productRouter.get("/fetch/", productController.fetchAllProducts);

productRouter.get("/:id",protectRoutes, productController.getProductById);
productRouter.put("/:id",protectRoutes, productController.updateProduct);
// productRouter.put(
//   "/photos/:id",
//   protectRoutes,
//   uploadMixFile("products", [{ name: "gallery" }, { name: "pic" }]),
//   fileSizeLimitErrorHandler,
//   productController.updatePhotos
// );
productRouter.delete("/:id",protectRoutes, productController.deleteProduct);

export default productRouter;
