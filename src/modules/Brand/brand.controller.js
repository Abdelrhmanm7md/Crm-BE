import { brandModel } from "../../../database/models/brand.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createBrand = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
    let newBrand = new brandModel(req.body);
    let addedBrand = await newBrand.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Brand has been created successfully!",
      addedBrand,
    });
  });
  

const getAllBrand = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(brandModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
    let message_1 = "No Brand was found!"
    if(req.query.lang == "ar"){
      message_1 = "لم يتم العثور على العلامة التجارية!"
    }
 !ApiFeat && res.status(404).json({ message: message_1 });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});


const exportBrand = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    brandModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const getBrandById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Brand = await brandModel.find({_id:id});
  let message_1 = " Brand not found!"
  if(req.query.lang == "ar"){
    message_1 = "العلامة التجارية غير موجودة!"
  }
 !Brand && res.status(404).json({ message: message_1 });

Brand=Brand[0]

  res.status(200).json({ message: "Done", Brand });
});
const updateBrand = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const updatedBrand = await brandModel.findByIdAndUpdate(id, req.body, { new: true, context: { query: req.query } });
let message_1 = "Couldn't update! Not found!"
if(req.query.lang == "ar"){
  message_1 = "تعذر التحديث! غير موجود!"
}

  if (!updatedBrand) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: "Brand updated successfully!", updatedBrand });
});

const deleteBrand = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let brand = await brandModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  if(req.query.lang == "ar"){
    message_1 = "تعذر الحذف! غير موجود!"
  }
  if (!brand) {
    return res.status(404).json({ message: message_1 });
  }

  brand.userId = req.userId;
  await brand.deleteOne();

  res.status(200).json({ message: "Brand deleted successfully!" });
});

export {
  createBrand,
  getAllBrand,
  exportBrand,
  getBrandById,
  deleteBrand,
  updateBrand,
};
