import express from "express";
const supplierRouter = express.Router();

import * as supplierController from "./supplier.controller.js";


supplierRouter.get("/", supplierController.getAllSupplier);
supplierRouter.get("/:id", supplierController.getSupplierById);
supplierRouter.put("/:id", supplierController.updateSupplier);
supplierRouter.post("/", supplierController.createSupplier);
supplierRouter.delete("/:id", supplierController.deleteSupplier);

export default supplierRouter;
