import { couponModel } from "../../../database/models/coupon.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import AppError from "../../utils/appError.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createCoupon =catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  req.body.expires = new Date(req.body.expires);
    let results = new couponModel(req.body);
    let added = await results.save({ context: { query: req.query } });
    res.status(201).json({ message: "added", added });
  }

);

const getAllCoupons = catchAsync(async (req, res, next) => {
  let apiFeature = new ApiFeature(couponModel.find(), req.query)
    // .pagination()
    // .sort()
    // .search()
    // .fields();
  let results = await apiFeature.mongooseQuery;
  res.json({ message: "Done", results });
});

const getCouponById = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let results = await couponModel.findOne({ _id: id });
  let message_1 = "Coupon not found!"
  if(req.query.lang == "ar"){
    message_1 = "الكوبون غير موجود!"
  }
  if (!results || results.length === 0) {
    return res.status(404).json({ message: message_1 });
  }
    res.json({ message: "Done", results });
});

const getCheckCoupon = catchAsync(async (req, res, next) => {
  let results = await couponModel.find({ code: req.body.code });
  let message_1 = "Coupon not found!"
  let message_2 = "Coupon is not valid!"
  let message_3 = "Coupon is valid and ready to use!"
  if(req.query.lang == "ar"){
    message_1 = "الكوبون غير موجود!"
    message_2 = "الكوبون غير صالح!"
    message_3 = "الكوبون صالح وجاهز للاستخدام!"
  }

  if(results && results.length > 0){
    results = results[0]
    
    if(results.isValid == false){
      res.status(404).json({ message: message_2 });
    }else{
      res.json({ message: message_3 , results }); 
    }
}else{
  res.status(404).json({ message: message_1 });
}
});

const updateCoupon = catchAsync(async (req, res, next) => {
  // lazem akon ana elly 3mlt review
  let { id } = req.params; // id review
  // user .... req.user._id
  let results = await couponModel.findOneAndUpdate({ _id: id }, req.body, {
    new: true, context: { query: req.query }
  });
  let message_1 ="Couldn't update! Not found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم التحديث! غير موجود!"
  }
  if (!results || results.length === 0) {
    return res.status(404).json({ message: message_1 });
  }
  results && res.json({ message: "Done", results });
});

const deleteCoupon =  catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let coupon = await couponModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
  }
  if (!coupon) {
    return res.status(404).json({ message: message_1 });
  }

  coupon.userId = req.userId;
  await coupon.deleteOne();

  res.status(200).json({ message: "Coupon deleted successfully!" });
});

export {
  createCoupon,
  getAllCoupons,
  getCouponById,
  getCheckCoupon,
  updateCoupon,
  deleteCoupon,
};
