import express from "express";
const inventoryRouter = express.Router();

import * as inventoryController from "./inventory.controller.js";


inventoryRouter.get("/", inventoryController.getAllInventory);
inventoryRouter.get("/:id", inventoryController.getInventoryById);
inventoryRouter.put("/:id", inventoryController.updateInventory);
inventoryRouter.post("/", inventoryController.createInventory);
inventoryRouter.delete("/:id", inventoryController.deleteInventory);

export default inventoryRouter;
