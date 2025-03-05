import express from "express";
const orderRouter = express.Router();

import * as orderController from "./order.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


orderRouter.get("/",protectRoutes, orderController.getAllOrder);
orderRouter.get("/status/:status",protectRoutes, orderController.getAllOrdersByStatus);
orderRouter.get("/shipping/:shippingId",protectRoutes, orderController.getAllOrdersByShippingCompany);
orderRouter.get("/:id",protectRoutes, orderController.getOrderById);
orderRouter.put("/:id",protectRoutes, orderController.updateOrder);
orderRouter.post("/",protectRoutes, orderController.createOrder);
orderRouter.delete("/:id",protectRoutes, orderController.deleteOrder);

export default orderRouter;
