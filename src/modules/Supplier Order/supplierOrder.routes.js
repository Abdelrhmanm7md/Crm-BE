import express from "express";
const supplierOrderRouter = express.Router();

import * as supplierOrderController from "./supplierOrder.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


supplierOrderRouter.get("/",protectRoutes, supplierOrderController.getAllSupplierOrder);
supplierOrderRouter.get("/:id",protectRoutes, supplierOrderController.getSupplierOrderById);
supplierOrderRouter.put("/:id",protectRoutes, supplierOrderController.updateSupplierOrder);
supplierOrderRouter.post("/",protectRoutes, supplierOrderController.createSupplierOrder);
supplierOrderRouter.delete("/:id",protectRoutes, supplierOrderController.deleteSupplierOrder);

export default supplierOrderRouter;
