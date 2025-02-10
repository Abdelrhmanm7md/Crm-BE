import express from "express";
const productRouter = express.Router();

import * as productController from "./products.controller.js";
import { fileSizeLimitErrorHandler, uploadMixFile, } from "../../utils/middleWare/fileUploads.js";

productRouter.get("/", productController.getAllProduct);
productRouter.get("/:id", productController.getProductById);
productRouter.put("/:id", productController.updateProduct);
productRouter.post(
  "/",
  uploadMixFile("products", [{ name: "images" }]),
  fileSizeLimitErrorHandler,
  productController.createProduct
);
productRouter.delete("/:id", productController.deleteProduct);

export default productRouter;
