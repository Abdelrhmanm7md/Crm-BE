import express from "express";
const inventoryRouter = express.Router();

import * as inventoryController from "./inventory.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


inventoryRouter.get("/",protectRoutes, inventoryController.getAllInventory);
inventoryRouter.get("/:id",protectRoutes, inventoryController.getInventoryById);
inventoryRouter.put("/:id",protectRoutes, inventoryController.updateInventory);
inventoryRouter.put("/:inventoryId/:transferId",protectRoutes, inventoryController.updateTransferProductQuantity);
inventoryRouter.post("/",protectRoutes, inventoryController.createInventory);
// inventoryRouter.delete("/:id",protectRoutes, inventoryController.deleteInventory);

export default inventoryRouter;
