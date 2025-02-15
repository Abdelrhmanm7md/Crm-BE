import express from "express";
const productRouter = express.Router();

import * as productController from "./products.controller.js";
import { fileSizeLimitErrorHandler, uploadMixFile, } from "../../utils/middleWare/fileUploads.js";

productRouter.post(
  "/",
  uploadMixFile("products", [{ name: "gallery" }, { name: "pic" }]),
  fileSizeLimitErrorHandler,
  productController.createProduct
);
productRouter.get("/", productController.getAllProduct);
productRouter.get("/:id", productController.getProductById);
productRouter.put("/:id", productController.updateProduct);
productRouter.put(
  "/photos/:id",
  uploadMixFile("products", [{ name: "gallery" }, { name: "pic" }]),
  fileSizeLimitErrorHandler,
  productController.updatePhotos
);
productRouter.delete("/:id", productController.deleteProduct);

export default productRouter;
