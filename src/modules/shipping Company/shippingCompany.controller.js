import { orderModel } from "../../../database/models/order.model.js";
import { shippingCompanyModel } from "../../../database/models/shippingCompany.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createShippingCompany = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  let newshippingCompany = new shippingCompanyModel(req.body);
  let addedshippingCompany = await newshippingCompany.save({
    context: { query: req.query },
  });

  res.status(201).json({
    message: "shipping Company has been created successfully!",
    addedshippingCompany,
  });
});

const getAllShippingCompany = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(shippingCompanyModel.find(), req.query);
  await ApiFeat.pagination();
  // .pagination()
  // .filter()
  // .sort()
  // .search()
  // .fields();

  let results = await ApiFeat.mongooseQuery;
  res.json({
    message: "Done",
    page: ApiFeat.page,
    totalPages: ApiFeat.totalPages,
    results,
  });
});

const exportShippingCompany = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  let ApiFeat = new ApiFeature(shippingCompanyModel.find(), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});

const getShippingCompanyById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let shippingCompanies = await shippingCompanyModel.find({ _id: id });

  let message_1 = "Shipping Company not found!";
  if (req.query.lang == "ar") {
    message_1 = "لم يتم العثور على شركة الشحن";
  }

  if (!shippingCompanies || shippingCompanies.length === 0) {
    return res.status(404).json({ message: message_1 });
  }

  let shippingCompany = shippingCompanies[0].toObject();

  let orders = await orderModel
    .find({ shippingCompany: id, orderStatus: "shipping" })
    .lean(); 

  console.log("Orders Found:", orders);

  shippingCompany.orders = orders || [];

  res.status(200).json({ message: "Done", shippingCompany });
});

const updateShippingCompany = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let {
    name,
    email,
    phone,
    addresses,
    governorate,
    country,
    company,
    postCode,
    priceList,
    collectionDoneAmount,
  } = req.body;

  let updatedShippingCompany = await shippingCompanyModel.findByIdAndUpdate(
    id,
    {
      $set: {
        name,
        email,
        phone,
        addresses,
        governorate,
        country,
        company,
        postCode,
        priceList,
      },
      $push: {
        collectionDoneAmount: {
          date: req.body.date || new Date(),
          amount: req.body.amount,
        },
      },
    },
    {
      new: true,
      userId: req.userId,
      context: { query: req.query },
    }
  );
  let message_1 = "Couldn't update!  not found!";
  let message_2 = "shipping Company updated successfully!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر التحديث! غير موجود!";
    message_2 = "تم تحديث شركة الشحن بنجاح!";
  }

  if (!updatedShippingCompany) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: message_2, updatedShippingCompany });
});
const deleteShippingCompany = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let shippingCompany = await shippingCompanyModel.findById(id);
  let message_1 = "Couldn't delete! Not found!";
  let message_2 = "ShippingCompany deleted successfully!";
  if (req.query.lang == "ar") {
    message_1 = "لم يتم الحذف! غير موجود!";
    message_2 = "تم حذف شركة الشحن بنجاح!";
  }
  if (!shippingCompany) {
    return res.status(404).json({ message: message_1 });
  }

  shippingCompany.userId = req.userId;
  await shippingCompany.deleteOne();

  res.status(200).json({ message: message_2 });
});
export {
  createShippingCompany,
  getAllShippingCompany,
  exportShippingCompany,
  getShippingCompanyById,
  deleteShippingCompany,
  updateShippingCompany,
};
