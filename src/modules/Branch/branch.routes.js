import express from "express";
const branchRouter = express.Router();

import * as branchController from "./branch.controller.js";


branchRouter.get("/", branchController.getAllBranch);
branchRouter.get("/:id", branchController.getBranchById);
branchRouter.put("/:id", branchController.updateBranch);
branchRouter.post("/", branchController.createBranch);
branchRouter.delete("/:id", branchController.deleteBranch);

export default branchRouter;
