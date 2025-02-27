import express from "express";
const statsRouter = express.Router();

import * as statsController from "./stats.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";


statsRouter.get("/", statsController.getAllStats);


export default statsRouter;
