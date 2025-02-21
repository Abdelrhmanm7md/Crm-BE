import express from "express";
const salaryRouter = express.Router();

import * as salaryController from "./salary.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


salaryRouter.get("/",protectRoutes, salaryController.getAllSalary);
salaryRouter.get("/export/", protectRoutes,salaryController.exportSalary);
salaryRouter.get("/:id",protectRoutes, salaryController.getSalaryById);
salaryRouter.put("/:id",protectRoutes, salaryController.updateSalary);
salaryRouter.post("/",protectRoutes, salaryController.createSalary);
salaryRouter.delete("/:id",protectRoutes, salaryController.deleteSalary);

export default salaryRouter;
