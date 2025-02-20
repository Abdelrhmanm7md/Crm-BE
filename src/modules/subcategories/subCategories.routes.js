import express from "express";
import * as subCategoryController from "./subCategories.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";
const subCategoryRouter = express.Router({mergeParams: true});

subCategoryRouter.route("/")
    .get(protectRoutes,subCategoryController.getAllSubCategories)
    .post(protectRoutes,subCategoryController.createSubCategory);
subCategoryRouter.get("/export/",protectRoutes, subCategoryController.exportSub);
subCategoryRouter.route("/:id")
    .get(protectRoutes,subCategoryController.getSubCategoryById)
    .put(protectRoutes,subCategoryController.updateSubCategory)
    .delete(protectRoutes,subCategoryController.deleteSubCategory);

export default subCategoryRouter;



// http://localhost:3000/api/v1/category .... categories routes

// http://localhost:3000/api/v1/category/6431bf25fdca014a813d95b5/subCategory/ ===> subcategory



