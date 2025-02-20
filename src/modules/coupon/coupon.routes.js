import express from "express";
import * as couponController from "./coupon.controller.js";
import { protectRoutes } from "../auth/auth.controller.js";
const couponRouter = express.Router();

// category/:cartegoryId/subCategory

couponRouter
  .route("/")
  .get(protectRoutes,couponController.getAllCoupons)
  .post(protectRoutes, couponController.createCoupon);

couponRouter
  .route("/:id")
  .get(protectRoutes,couponController.getCouponById)
  .put(protectRoutes, couponController.updateCoupon)
  .delete(protectRoutes,couponController.deleteCoupon);

export default couponRouter;
