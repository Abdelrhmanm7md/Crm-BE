import express from "express";
const profitRouter = express.Router();

import * as profitController from "./profit.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


profitRouter.get("/",protectRoutes, profitController.getAllProfit);
profitRouter.get("/export/", protectRoutes,profitController.exportProfit);
profitRouter.get("/:id",protectRoutes, profitController.getProfitById);
profitRouter.put("/:id",protectRoutes, profitController.updateProfit);
profitRouter.post("/",protectRoutes, profitController.createProfit);
profitRouter.delete("/:id",protectRoutes, profitController.deleteProfit);

export default profitRouter;
