import { supplierModel } from "../../../database/models/supplier.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createSupplier = catchAsync(async (req, res, next) => {
    let newSupplier = new supplierModel(req.body);
    let addedSupplier = await newSupplier.save();
  
    res.status(201).json({
      message: "Supplier has been created successfully!",
      addedSupplier,
    });
  });
  

const getAllSupplier = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(supplierModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
 !ApiFeat && res.status(404).json({ message: "No Supplier was found!" });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const getSupplierById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Supplier = await supplierModel.findById(id);

 !Supplier && res.status(404).json({ message: "Supplier not found!" });


  res.status(200).json({ message: "Done", Supplier });
});
const updateSupplier = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let updatedSupplier = await supplierModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  if (!updatedSupplier) {
    return res.status(404).json({ message: "Couldn't update!  not found!" });
  }

  res
    .status(200)
    .json({ message: "Supplier updated successfully!", updatedSupplier });
});
const deleteSupplier = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let deletedSupplier = await supplierModel.findByIdAndDelete({ _id: id });

  if (!deletedSupplier) {
    return res.status(404).json({ message: "Couldn't delete!  not found!" });
  }

  res.status(200).json({ message: "Supplier deleted successfully!" });
});

export {
  createSupplier,
  getAllSupplier,
  getSupplierById,
  deleteSupplier,
  updateSupplier,
};
