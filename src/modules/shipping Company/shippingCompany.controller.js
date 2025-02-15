import { shippingCompanyModel } from "../../../database/models/shippingCompany.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createShippingCompany = catchAsync(async (req, res, next) => {
    let newshippingCompany = new shippingCompanyModel(req.body);
    let addedshippingCompany = await newshippingCompany.save();
  
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
 !ApiFeat && res.status(404).json({ message: "No shipping Company was found!" });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const getShippingCompanyById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let shippingCompany = await shippingCompanyModel.findById(id);

 !shippingCompany && res.status(404).json({ message: "shipping Company not found!" });


  res.status(200).json({ message: "Done", shippingCompany });
});
const updateShippingCompany = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedshippingCompany = await shippingCompanyModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  if (!updatedshippingCompany) {
    return res.status(404).json({ message: "Couldn't update!  not found!" });
  }

  res
    .status(200)
    .json({ message: "shipping Company updated successfully!", updatedshippingCompany });
});
const deleteShippingCompany = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let deletedshippingCompany = await shippingCompanyModel.findByIdAndDelete({ _id: id });

  if (!deletedshippingCompany) {
    return res.status(404).json({ message: "Couldn't delete!  not found!" });
  }

  res.status(200).json({ message: "shippingCompany deleted successfully!" });
});

export {
  createShippingCompany,
  getAllShippingCompany,
  getShippingCompanyById,
  deleteShippingCompany,
  updateShippingCompany,
};
