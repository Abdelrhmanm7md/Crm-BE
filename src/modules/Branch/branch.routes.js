import express from "express";
const branchRouter = express.Router();

import * as branchController from "./branch.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


branchRouter.get("/",protectRoutes, branchController.getAllBranch);
branchRouter.get("/:id",protectRoutes, branchController.getBranchById);
branchRouter.put("/:id",protectRoutes, branchController.updateBranch);
branchRouter.post("/",protectRoutes, branchController.createBranch);
branchRouter.delete("/:id",protectRoutes, branchController.deleteBranch);

export default branchRouter;
