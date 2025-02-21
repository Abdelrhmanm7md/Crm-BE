import express from "express";
const capitalRouter = express.Router();

import * as capitalController from "./capital.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


capitalRouter.get("/",protectRoutes, capitalController.getAllCapital);
capitalRouter.get("/export/", protectRoutes,capitalController.exportCapital);
capitalRouter.get("/:id",protectRoutes, capitalController.getCapitalById);
capitalRouter.put("/:id",protectRoutes, capitalController.updateCapital);
capitalRouter.post("/",protectRoutes, capitalController.createCapital);
capitalRouter.delete("/:id",protectRoutes, capitalController.deleteCapital);

export default capitalRouter;
