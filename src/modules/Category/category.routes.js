import express from "express";
const categoryRouter = express.Router();

import * as categoryController from "./category.controller.js";


categoryRouter.get("/", categoryController.getAllCategory);
categoryRouter.get("/:id", categoryController.getCategoryById);
categoryRouter.put("/:id", categoryController.updateCategory);
categoryRouter.post("/", categoryController.createCategory);
categoryRouter.delete("/:id", categoryController.deleteCategory);

export default categoryRouter;
