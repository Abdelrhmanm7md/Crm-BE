import { logModel } from "../../../database/models/log.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import exportData from "../../utils/export.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const getAllLog = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(logModel.find(), req.query).pagination();
  // .filter()
  // .sort()
  // .search()
  // .fields();

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done",page: ApiFeat.page, results ,});
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

export { getAllLog, exportBrand };
