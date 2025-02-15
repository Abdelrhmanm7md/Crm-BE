import express from "express";
const orderRouter = express.Router();

import * as orderController from "./order.controller.js";


orderRouter.get("/", orderController.getAllOrder);
orderRouter.get("/:id", orderController.getOrderById);
orderRouter.put("/:id", orderController.updateOrder);
orderRouter.post("/", orderController.createOrder);
orderRouter.delete("/:id", orderController.deleteOrder);

export default orderRouter;
