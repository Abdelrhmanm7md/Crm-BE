import express from "express";
const shippingCompanyRouter = express.Router();

import * as shippingCompanyController from "./shippingCompany.controller.js";


shippingCompanyRouter.get("/", shippingCompanyController.getAllShippingCompany);
shippingCompanyRouter.get("/:id", shippingCompanyController.getShippingCompanyById);
shippingCompanyRouter.put("/:id", shippingCompanyController.updateShippingCompany);
shippingCompanyRouter.post("/", shippingCompanyController.createShippingCompany);
shippingCompanyRouter.delete("/:id", shippingCompanyController.deleteShippingCompany);

export default shippingCompanyRouter;
