import express from "express";
const logRouter = express.Router();

import * as logController from "./log.controller.js";


logRouter.get("/",logController.getAllLog);
logRouter.delete("/",logController.deleteAllLog);


export default logRouter;
