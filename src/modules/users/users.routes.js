import express from "express";

const usersRouter = express.Router();

import * as usersController from "./users.controller.js";
import {
  fileFilterHandler,
  fileSizeLimitErrorHandler,
  uploadMixFile,
} from "../../utils/middleWare/fileUploads.js";
import { protectRoutes , allowTo } from "../auth/auth.controller.js";

usersRouter.get("/", usersController.getAllUsersByAdmin);

usersRouter.get("/:id",protectRoutes, usersController.getUserById);


usersRouter.post("/contactUs/:id", usersController.postMessage);

usersRouter.put("/:id", usersController.updateUser);
usersRouter.put("/pull/:id", usersController.updateUser2);
usersRouter.put(
  "/photo/:id",
  uploadMixFile("profilePic", [{ name: "profilePic" }]),
  fileFilterHandler,
  fileSizeLimitErrorHandler,
  usersController.updateprofilePic
);


usersRouter.delete("/:id", usersController.deleteUser);
export default usersRouter;
