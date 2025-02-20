import { shippingCompanyModel } from "../../../database/models/shippingCompany.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createShippingCompany = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.shippingCompany._id;
    let newshippingCompany = new shippingCompanyModel(req.body);
    let addedshippingCompany = await newshippingCompany.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "shipping Company has been created successfully!",
      addedshippingCompany,
    });
  });
  

const getAllShippingCompany = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(shippingCompanyModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
    let message_1 = "No shipping Company was found!"
    if(req.query.lang == "ar"){
      message_1 = "لم يتم العثور على شركة الشحن"
    }
 !ApiFeat && res.status(404).json({ message: message_1 });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const exportShippingCompany = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    shippingCompanyModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const getShippingCompanyById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let shippingCompany = await shippingCompanyModel.findById(id);
  let message_1 = "shipping Company not found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على شركة الشحن"
  }

 !shippingCompany && res.status(404).json({ message: message_1 });


  res.status(200).json({ message: "Done", shippingCompany });
});
const updateShippingCompany = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedshippingCompany = await shippingCompanyModel.findByIdAndUpdate(id, req.body, {
    new: true, context: { query: req.query }
  });
  let message_1 = "Couldn't update!  not found!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر التحديث! غير موجود!"
  }

  if (!updatedshippingCompany) {
    return res.status(404).json({ message: message_1 });
  }

  res
    .status(200)
    .json({ message: "shipping Company updated successfully!", updatedshippingCompany });
});
const deleteShippingCompany = catchAsync(async (req, res, next) => {
    let { id } = req.params;
  
    // Find the shippingCompany first
    let shippingCompany = await shippingCompanyModel.findById(id);
    let message_1 = "Couldn't delete! Not found!"
    if(req.query.lang == "ar"){
      message_1 = "لم يتم الحذف! غير موجود!"
    }
    if (!shippingCompany) {
      return res.status(404).json({ message: message_1 });
    }
  
    shippingCompany.userId = req.userId;
    await shippingCompany.deleteOne();
  
    res.status(200).json({ message: "ShippingCompany deleted successfully!" });
  });
export {
  createShippingCompany,
  getAllShippingCompany,
  exportShippingCompany,
  getShippingCompanyById,
  deleteShippingCompany,
  updateShippingCompany,
};
