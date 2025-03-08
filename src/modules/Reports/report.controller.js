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
  let { startDate, endDate } = req.query;
  let filter = {};

  if (startDate && endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Ensure endDate includes the entire day

    filter.$or = [
      { supplierOrderAt: { $gte: start, $lte: end } },
      { supplierOrderAt: null, createdAt: { $gte: start, $lte: end } }
    ];
  }

  let ApiFeat = new ApiFeature(productModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});

const getReportsOrder = catchAsync(async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let filter = {};
  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999),
    };
  }
  let ApiFeat = new ApiFeature(orderModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});

const getReportsBranch= catchAsync(async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let filter = {};

  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999),
    };
  }

  let ApiFeat = new ApiFeature(branchModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});
const getReportsCapital = catchAsync(async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let filter = {};

  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999),
    };
  }

  let ApiFeat = new ApiFeature(capitalModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});
const getReportsCustomer = catchAsync(async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let filter = {};

  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999),
    };
  }

  let ApiFeat = new ApiFeature(customerModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});
const getReportsExpense = catchAsync(async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let filter = {};

  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999),
    };
  }

  let ApiFeat = new ApiFeature(expensesModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});

const getReportsSalary = catchAsync(async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let filter = {};

  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999),
    };
  }

  let ApiFeat = new ApiFeature(salaryModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});
const getReportsShippingCompany = catchAsync(async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let filter = {};

  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999),
    };
  }

  let ApiFeat = new ApiFeature(shippingCompanyModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});
const getReportsSupplier = catchAsync(async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let filter = {};

  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999),
    };
  }

  let ApiFeat = new ApiFeature(supplierModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});
const getReportsSupplierOrder = catchAsync(async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let filter = {};

  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999),
    };
  }

  let ApiFeat = new ApiFeature(supplierOrderModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    results,
  });
});
const getReportsUsers = catchAsync(async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let filter = {};

  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999),
    };
  }

  let ApiFeat = new ApiFeature(userModel.find(filter), req.query);
  let results = await ApiFeat.mongooseQuery;

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
