import express from "express";
const categoryRouter = express.Router();

import * as categoryController from "./category.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


categoryRouter.get("/",protectRoutes, categoryController.getAllCategory);
categoryRouter.get("/fetch/",protectRoutes, categoryController.fetchAllCategory);
categoryRouter.get("/export/",protectRoutes, categoryController.exportCategory);
categoryRouter.get("/:id",protectRoutes, categoryController.getCategoryById);
categoryRouter.put("/:id",protectRoutes, categoryController.updateCategory);
categoryRouter.post("/",protectRoutes, categoryController.createCategory);
categoryRouter.delete("/:id",protectRoutes, categoryController.deleteCategory);

export default categoryRouter;
