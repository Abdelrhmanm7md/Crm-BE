import express from "express";
const colorRouter = express.Router();

import * as colorController from "./color.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


colorRouter.get("/",protectRoutes, colorController.getAllColor);
colorRouter.get("/:id",protectRoutes, colorController.getColorById);
colorRouter.put("/:id",protectRoutes, colorController.updateColor);
colorRouter.post("/",protectRoutes, colorController.createColor);
colorRouter.delete("/:id",protectRoutes, colorController.deleteColor);

export default colorRouter;
