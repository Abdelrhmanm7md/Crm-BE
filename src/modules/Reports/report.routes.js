import express from "express";
const reportRouter = express.Router();

import * as reportController from "./report.controller.js";


reportRouter.get("/product/", reportController.getReportsProduct);
reportRouter.get("/customer/", reportController.getReportsCustomer);
reportRouter.get("/supplier/", reportController.getReportsSupplier);
reportRouter.get("/branch/", reportController.getReportsBranch);
reportRouter.get("/order/", reportController.getReportsOrder);
reportRouter.get("/salary/", reportController.getReportsSalary);
reportRouter.get("/expense/", reportController.getReportsExpense);
reportRouter.get("/shipping/", reportController.getReportsShippingCompany);
reportRouter.get("/supplierOrder/", reportController.getReportsSupplierOrder);
reportRouter.get("/user/", reportController.getReportsUsers);
reportRouter.get("/capital/", reportController.getReportsCapital);


export default reportRouter;
