import express from "express";
const brandRouter = express.Router();

import * as brandController from "./brand.controller.js";


brandRouter.get("/", brandController.getAllBrand);
brandRouter.get("/:id", brandController.getBrandById);
brandRouter.put("/:id", brandController.updateBrand);
brandRouter.post("/", brandController.createBrand);
brandRouter.delete("/:id", brandController.deleteBrand);

export default brandRouter;
