import express from "express";
const productRouter = express.Router();

import * as productController from "./products.controller.js";
import { fileSizeLimitErrorHandler, uploadMixFile, } from "../../utils/middleWare/fileUploads.js";
import { protectRoutes } from "../auth/auth.controller.js";

productRouter.post(
  "/",protectRoutes,
  productController.createProduct
);
productRouter.get("/",protectRoutes, productController.getAllProduct);
productRouter.get("/category/:categoryId",protectRoutes, productController.getAllProductsByCategory);
productRouter.get("/brand/:brandId",protectRoutes, productController.getAllProductsByBrand);
productRouter.get("/branch/:branchId",protectRoutes, productController.getAllProductsByBranch);
productRouter.get("/supplier/:supplierId",protectRoutes, productController.getAllProductsBySupplier);
productRouter.get("/fetch/", productController.fetchAllProducts);
productRouter.get("/export/", productController.exportProducts);

productRouter.get("/:id",protectRoutes, productController.getProductById);
productRouter.put("/bulk/",productRouter, productController.updateProductsBulk);
productRouter.put("/:id",protectRoutes, productController.updateProduct);

productRouter.delete("/bulk/",protectRoutes, productController.deleteProducts);

export default productRouter;
