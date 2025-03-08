import { branchModel } from "../../../database/models/branch.model.js";
import { capitalModel } from "../../../database/models/capital.model.js";
import { customerModel } from "../../../database/models/customer.model.js";
import { expensesModel } from "../../../database/models/expenses.model.js";
import { orderModel } from "../../../database/models/order.model.js";
import { productModel } from "../../../database/models/product.model.js";
import { salaryModel } from "../../../database/models/salaries.model.js";
import { shippingCompanyModel } from "../../../database/models/shippingCompany.model.js";
import { supplierModel } from "../../../database/models/supplier.model.js";
import { supplierOrderModel } from "../../../database/models/supplierOrder.model.js";
import { userModel } from "../../../database/models/user.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const getReportsProduct = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(productModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
      if(item.supplierOrderAt == null){
        return new Date(item.createdAt) >= new Date(startDate) && new Date(item.createdAt).setHours(23, 59, 59, 999) <= new Date(endDate);
      }else{
        return new Date(item.supplierOrderAt) >= new Date(startDate) && new Date(item.supplierOrderAt).setHours(23, 59, 59, 999) <= new Date(endDate);
      }
    });
  }
  res.json({
    message: "Done",
    results,
  });
});
const getReportsOrder = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(orderModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
        return new Date(item.updatedAt) >= new Date(startDate) && new Date(item.updatedAt).setHours(23, 59, 59, 999) <= new Date(endDate);
    });
  }
  res.json({
    message: "Done",
    results,
  });
});

const getReportsBranch= catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(branchModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
        return new Date(item.updatedAt) >= new Date(startDate) && new Date(item.updatedAt).setHours(23, 59, 59, 999) <= new Date(endDate);
    });
  }
  res.json({
    message: "Done",
    results,
  });
});
const getReportsCapital = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(capitalModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
        return new Date(item.updatedAt) >= new Date(startDate) && new Date(item.updatedAt).setHours(23, 59, 59, 999) <= new Date(endDate);
    });
  }
  res.json({
    message: "Done",
    results,
  });
});
const getReportsCustomer = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(customerModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
        return new Date(item.updatedAt) >= new Date(startDate) && new Date(item.updatedAt).setHours(23, 59, 59, 999) <= new Date(endDate);
    });
  }
  res.json({
    message: "Done",
    results,
  });
});
const getReportsExpense = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(expensesModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
        return new Date(item.updatedAt) >= new Date(startDate) && new Date(item.updatedAt).setHours(23, 59, 59, 999) <= new Date(endDate);
    });
  }
  res.json({
    message: "Done",
    results,
  });
});

const getReportsSalary = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(salaryModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
        return new Date(item.updatedAt) >= new Date(startDate) && new Date(item.updatedAt).setHours(23, 59, 59, 999) <= new Date(endDate);
    });
  }
  res.json({
    message: "Done",
    results,
  });
});
const getReportsShippingCompany = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(shippingCompanyModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
        return new Date(item.updatedAt) >= new Date(startDate) && new Date(item.updatedAt).setHours(23, 59, 59, 999) <= new Date(endDate);
    });
  }
  res.json({
    message: "Done",
    results,
  });
});
const getReportsSupplier = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(supplierModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
        return new Date(item.updatedAt) >= new Date(startDate) && new Date(item.updatedAt).setHours(23, 59, 59, 999) <= new Date(endDate);
    });
  }
  res.json({
    message: "Done",
    results,
  });
});
const getReportsSupplierOrder = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(supplierOrderModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
        return new Date(item.updatedAt) >= new Date(startDate) && new Date(item.updatedAt).setHours(23, 59, 59, 999) <= new Date(endDate);
    });
  }
  res.json({
    message: "Done",
    results,
  });
});
const getReportsUsers = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(userModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  results = JSON.stringify(results);
  results = JSON.parse(results);
  let { startDate, endDate } = req.query;
  if (startDate && endDate) {
    results = results.filter(function (item) {
        return new Date(item.updatedAt) >= new Date(startDate) && new Date(item.updatedAt).setHours(23, 59, 59, 999) <= new Date(endDate);
    });
  }
  res.json({
    message: "Done",
    results,
  });
});

export { 
  getReportsProduct,
  getReportsExpense,
  getReportsSalary,
  getReportsShippingCompany,
  getReportsSupplier,
  getReportsSupplierOrder,
  getReportsUsers,
  getReportsOrder,
  getReportsCustomer,
  getReportsCapital,
  getReportsBranch,

};
