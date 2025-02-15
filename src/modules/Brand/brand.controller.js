import { brandModel } from "../../../database/models/brand.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createBrand = catchAsync(async (req, res, next) => {
    let newBrand = new brandModel(req.body);
    let addedBrand = await newBrand.save();
  
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
 !ApiFeat && res.status(404).json({ message: "No Brand was found!" });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const getBrandById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Brand = await brandModel.findById(id);

 !Brand && res.status(404).json({ message: "Brand not found!" });


  res.status(200).json({ message: "Done", Brand });
});
const updateBrand = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, category, suppliersToAdd, suppliersToRemove } = req.body;

  const update = { name, category };

  if (suppliersToAdd && suppliersToAdd.length > 0) {
    update.$push = { suppliers: { $each: suppliersToAdd } };
  }

  if (suppliersToRemove && suppliersToRemove.length > 0) {
    update.$pull = { suppliers: { $in: suppliersToRemove } };
  }

  const updatedBrand = await brandModel.findByIdAndUpdate(id, update, { new: true });

  if (!updatedBrand) {
    return res.status(404).json({ message: "Couldn't update! Not found!" });
  }

  res.status(200).json({ message: "Brand updated successfully!", updatedBrand });
});

const deleteBrand = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let deletedBrand = await brandModel.findByIdAndDelete({ _id: id });

  if (!deletedBrand) {
    return res.status(404).json({ message: "Couldn't delete!  not found!" });
  }

  res.status(200).json({ message: "Brand deleted successfully!" });
});

export {
  createBrand,
  getAllBrand,
  getBrandById,
  deleteBrand,
  updateBrand,
};
