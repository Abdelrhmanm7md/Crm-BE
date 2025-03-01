import express from "express";
const expensesRouter = express.Router();

import * as expensesController from "./expenses.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


expensesRouter.get("/",protectRoutes, expensesController.getAllExpenses);
expensesRouter.get("/today/",protectRoutes, expensesController.getAllExpensesToday);
expensesRouter.get("/specific/",protectRoutes, expensesController.getAllExpensesSpecificDate);
expensesRouter.get("/:id",protectRoutes, expensesController.getExpensesById);
expensesRouter.put("/:id",protectRoutes, expensesController.updateExpenses);
expensesRouter.post("/",protectRoutes, expensesController.createExpenses);
expensesRouter.delete("/:id",protectRoutes, expensesController.deleteExpenses);

export default expensesRouter;
