import express from "express";
const sizeRouter = express.Router();

import * as sizeController from "./size.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


sizeRouter.get("/",protectRoutes, sizeController.getAllSize);
sizeRouter.get("/:id",protectRoutes, sizeController.getSizeById);
sizeRouter.put("/:id",protectRoutes, sizeController.updateSize);
sizeRouter.post("/",protectRoutes, sizeController.createSize);
sizeRouter.delete("/:id",protectRoutes, sizeController.deleteSize);

export default sizeRouter;
