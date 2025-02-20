import express from "express";
const brandRouter = express.Router();

import * as brandController from "./brand.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


brandRouter.get("/",protectRoutes, brandController.getAllBrand);
brandRouter.get("/export/",protectRoutes, brandController.exportBrand);
brandRouter.get("/:id",protectRoutes, brandController.getBrandById);
brandRouter.put("/:id",protectRoutes, brandController.updateBrand);
brandRouter.post("/",protectRoutes, brandController.createBrand);
brandRouter.delete("/:id",protectRoutes, brandController.deleteBrand);

export default brandRouter;
