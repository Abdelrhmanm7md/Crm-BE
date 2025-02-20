import express from "express";
const customerRouter = express.Router();

import * as customerController from "./customer.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


customerRouter.get("/",protectRoutes, customerController.getAllCustomer);
customerRouter.get("/export/", protectRoutes,customerController.exportCustomer);
customerRouter.get("/:id",protectRoutes, customerController.getCustomerById);
customerRouter.put("/:id",protectRoutes, customerController.updateCustomer);
customerRouter.post("/",protectRoutes, customerController.createCustomer);
customerRouter.delete("/:id",protectRoutes, customerController.deleteCustomer);

export default customerRouter;
