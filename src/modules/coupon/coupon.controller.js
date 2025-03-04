import { couponModel } from "../../../database/models/coupon.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import AppError from "../../utils/appError.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import axios from "axios";
import cron from "node-cron";
import * as dotenv from "dotenv";
dotenv.config();

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
    new: true,userId: req.userId, context: { query: req.query }
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


const fetchAndStoreCoupons = async () => {
  try {
    const response = await axios.get(
      `${process.env.WORDPRESS_URL}/wp-json/wc/v3/coupons`,
      {
        auth: {
          username: process.env.WC_CONSUMER_KEY,
          password: process.env.WC_CONSUMER_SECRET,
        },
      }
    );

    const coupons = response.data;

    for (const item of coupons) {
      await couponModel.findOneAndUpdate(
        { wordPressId: item.id }, // Check if coupon exists
        {
          wordPressId: item.id,
          code: item.code,
          amount: parseFloat(item.amount),
          discountType: item.discount_type,
          description: item.description || "",
          dateCreated: new Date(item.date_created),
        },
        { upsert: true, new: true } // Update if exists, insert if not
      );
    }

    console.log("✅ Coupons updated successfully.");
  } catch (error) {
    console.error("❌ Error fetching coupons:", error.response?.data || error.message);
  }
};

// Call the function
fetchAndStoreCoupons();
cron.schedule("0 */6 * * *", () => {
  console.log("🔄 Running scheduled product update...");
  fetchAndStoreCoupons();
});

// Call once at startup();

const fetchAllCoupons = catchAsync(async (req, res, next) => {

  
  fetchAndStoreCoupons();
  res.json({
    message: "Done",
  });
});
export {
  createCoupon,
  getAllCoupons,
  getCouponById,
  getCheckCoupon,
  updateCoupon,
  deleteCoupon,
  fetchAllCoupons,
};
