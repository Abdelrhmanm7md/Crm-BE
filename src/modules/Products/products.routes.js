import express from "express";
const productRouter = express.Router();

import * as productController from "./products.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";

productRouter.post(
  "/",protectRoutes,
  productController.createProduct
);
productRouter.get("/", productController.getAllProduct);
productRouter.get("/category/:categoryId",protectRoutes, productController.getAllProductsByCategory);
productRouter.get("/brand/:brandId",protectRoutes, productController.getAllProductsByBrand);
productRouter.get("/branch/:branchId",protectRoutes, productController.getAllProductsByBranch);
productRouter.get("/supplier/:supplierId",protectRoutes, productController.getAllProductsBySupplier);
productRouter.get("/fetch/",protectRoutes, productController.fetchAllProducts);
productRouter.post("/variation/:productId", productController.addProductVariation);
productRouter.get("/variation/:productId/:variationId", productController.getProductVariationById);

productRouter.put("/variation/:productId/:variationId", productController.updateProductVariation);
productRouter.delete("/variation/:productId/:variationId", productController.deleteProductVariation);

productRouter.get("/:id",protectRoutes, productController.getProductById);
productRouter.put("/bulk/",productRouter, productController.updateProductsBulk);
productRouter.put("/:id",protectRoutes, productController.updateProduct);

productRouter.delete("/bulk/",protectRoutes, productController.deleteProducts);

export default productRouter;
