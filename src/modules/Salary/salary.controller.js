import { salaryModel } from "../../../database/models/salaries.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createSalary = catchAsync(async (req, res, next) => {  
    req.body.createdBy = req.user._id;
    let newSalary = new salaryModel(req.body);
    let addedSalary = await newSalary.save({ context: { query: req.query } });
  
    res.status(201).json({
      message: "Salary has been created successfully!",
      addedSalary,
    });
  });
  

const getAllSalary = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(salaryModel.find(), req.query)
    // .pagination()
    // .filter()
    // .sort()
    // .search()
    // .fields();
//     let message_1 = "No Salary was found!"
//     if(req.query.lang == "ar"){
//       message_1 = "لم يتم العثور على عميل!"
//     }
//  !ApiFeat && res.status(404).json({ message: message_1 });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});

const exportSalary = catchAsync(async (req, res, next) => {
  // Define variables before passing them
  const query = {};
  const projection = { _id: 0 };
  const selectedFields = req.query.selectedFields || [];
  const specificIds = req.query.specificIds || [];

  await exportData(
    req,
    res,
    next,
    salaryModel,
    query,
    projection,
    selectedFields,
    specificIds
  );
});

const getSalaryById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Salary = await salaryModel.findById(id);
  let message_1 = "No Salary was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على عميل!"
  }
  if (!Salary || Salary.length === 0) {
    return res.status(404).json({ message: message_1 });
  }


  res.status(200).json({ message: "Done", Salary });
});
const updateSalary = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  let message_1 = "Couldn't update! Not found!";
  let message_2 = "Salary updated successfully!";
  
  if (req.query.lang == "ar") {
    message_1 = "تعذر التحديث! غير موجود!";
    message_2 = "تم تحديث الراتب بنجاح!";
  }

  let updatedSalaries;

  if (Array.isArray(id)) {
    updatedSalaries = await salaryModel.updateMany(
      { _id: { $in: id } }, 
      { $set: req.body },
      { new: true, multi: true }
    );
  } else {
    updatedSalaries = await salaryModel.findByIdAndUpdate(id, req.body, { new: true });
  }

  if (!updatedSalaries || (Array.isArray(id) && updatedSalaries.matchedCount === 0)) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ 
    message: message_2, 
    updatedSalaries 
  });
});

const deleteSalary = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  let customer = await salaryModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "Salary deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
    message_2 = "تم حذف الراتب بنجاح!"
  }
  if (!customer) {
    return res.status(404).json({ message: message_1 });
  }

  customer.userId = req.userId;
  await customer.deleteOne();

  res.status(200).json({ message: message_2 });
});

export {
  createSalary,
  getAllSalary,
  exportSalary,
  getSalaryById,
  deleteSalary,
  updateSalary,
};
