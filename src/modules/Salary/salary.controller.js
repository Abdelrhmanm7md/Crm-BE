import { salaryModel } from "../../../database/models/salaries.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createSalary = catchAsync(async (req, res, next) => {  
    req.body.createdBy = req.user._id;
    if(req.body.salary < 0){
      return next(new Error("Salary can't be negative"));
    }
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
const getAllSalaryByMonth = catchAsync(async (req, res, next) => {
  if (!req.query.date) {
    return res.status(400).json({ message: "Date parameter is required" });
  }

  let dateParts = req.query.date.split("/"); // Expecting format: YYYY/MM
  if (dateParts.length !== 2) {
    return res.status(400).json({ message: "Invalid date format. Expected YYYY/MM." });
  }

  let year = parseInt(dateParts[0]);
  let month = parseInt(dateParts[1]) - 1; // Month is 0-based in JS

  let startOfMonth = new Date(Date.UTC(year, month, 1));
  let endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)); // Last day of the month

  let ApiFeat = new ApiFeature(
    salaryModel.find({
      timeTable: {
        $elemMatch: {
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      }
    }),
    req.query
  );  

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });
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
  if (typeof id === "string" && id.startsWith("[")) {
    try {
      id = JSON.parse(id);
    } catch (error) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
  }
  if (Array.isArray(id)) {
    updatedSalaries = await salaryModel.updateMany(
      { _id: { $in: id } }, 
      { $set: req.body },
      {
        new: true,userId: req.userId, context: { query: req.query },
       multi: true }
    );
  } else {
    updatedSalaries = await salaryModel.findByIdAndUpdate(id, req.body, {
      new: true,userId: req.userId, context: { query: req.query }
    });
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
  let message_1 = "Couldn't delete! Not found!";
  let message_2 = "Salary deleted successfully!";

  if (req.query.lang == "ar") {
    message_1 = "لم يتم الحذف! غير موجود!";
    message_2 = "تم حذف الراتب بنجاح!";
  }

  if (typeof id === "string" && id.startsWith("[")) {
    try {
      id = JSON.parse(id); 
    } catch (error) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
  }

  if (Array.isArray(id)) {
    let deletedCount = 0;

    for (const salaryId of id) {
      let salary = await salaryModel.findById(salaryId);
      if (salary) {
        salary.userId = req.userId;
        await salary.deleteOne();
        deletedCount++;
      }
    }
    if (deletedCount === 0) {
      return res.status(404).json({ message: message_1 });
    }
    return res.status(200).json({ message: message_2, deletedCount });
  } else {
    let salary = await salaryModel.findById(id);
    if (!salary) {
      return res.status(404).json({ message: message_1 });
    }

    salary.userId = req.userId;
    await salary.deleteOne();

    return res.status(200).json({ message: message_2 });
  }
});


export {
  createSalary,
  getAllSalary,
  getAllSalaryByMonth,
  getSalaryById,
  deleteSalary,
  updateSalary,
};
