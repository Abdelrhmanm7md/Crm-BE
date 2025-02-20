import express from "express";
const shippingCompanyRouter = express.Router();

import * as shippingCompanyController from "./shippingCompany.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


shippingCompanyRouter.get("/",protectRoutes, shippingCompanyController.getAllShippingCompany);
shippingCompanyRouter.get("/export/",protectRoutes, shippingCompanyController.exportShippingCompany);
shippingCompanyRouter.get("/:id",protectRoutes, shippingCompanyController.getShippingCompanyById);
shippingCompanyRouter.put("/:id",protectRoutes, shippingCompanyController.updateShippingCompany);
shippingCompanyRouter.post("/",protectRoutes, shippingCompanyController.createShippingCompany);
shippingCompanyRouter.delete("/:id",protectRoutes, shippingCompanyController.deleteShippingCompany);

export default shippingCompanyRouter;
