import express from "express";
const supplierRouter = express.Router();

import * as supplierController from "./supplier.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


supplierRouter.get("/",protectRoutes, supplierController.getAllSupplier);
supplierRouter.get("/export/",protectRoutes, supplierController.exportSupplier);
supplierRouter.get("/:id",protectRoutes, supplierController.getSupplierById);
supplierRouter.put("/:id",protectRoutes, supplierController.updateSupplier);
supplierRouter.post("/",protectRoutes, supplierController.createSupplier);
supplierRouter.delete("/:id",protectRoutes, supplierController.deleteSupplier);

export default supplierRouter;
