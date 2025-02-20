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
productRouter.get("/export/",protectRoutes, productController.exportProduct);

productRouter.get("/:id",protectRoutes, productController.getProductById);
productRouter.put("/:id",protectRoutes, productController.updateProduct);
productRouter.put(
  "/photos/:id",
  protectRoutes,
  uploadMixFile("products", [{ name: "gallery" }, { name: "pic" }]),
  fileSizeLimitErrorHandler,
  productController.updatePhotos
);
productRouter.delete("/:id",protectRoutes, productController.deleteProduct);

export default productRouter;
