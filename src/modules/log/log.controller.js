import { logModel } from "../../../database/models/log.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const getAllLog = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(logModel.find().sort({ createdAt: -1 }), req.query);
  await ApiFeat.pagination(); // Ensure pagination waits for total count

  let results = await ApiFeat.mongooseQuery;

  res.json({
    message: "Done",
    page: ApiFeat.page,
    totalPages: ApiFeat.totalPages,
    results,
  });
});
const deleteAllLog = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(logModel.deleteMany(), req.query);


  res.json({
    message: "Done",
  });
});

export { getAllLog, deleteAllLog};
