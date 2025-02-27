import branchRouter from "./Branch/branch.routes.js";
import brandRouter from "./Brand/brand.routes.js";
import capitalRouter from "./Capital/capital.routes.js";
import categoryRouter from "./Category/category.routes.js";
import customerRouter from "./Customer/customer.routes.js";
import expensesRouter from "./expenses/expenses.routes.js";
import notiticationRouter from "./Notification/notification.routes.js";
import orderRouter from "./Order/order.routes.js";
import productRouter from "./Products/products.routes.js";
import salaryRouter from "./Salary/salary.routes.js";
import supplierOrderRouter from "./Supplier Order/supplierOrder.routes.js";
import supplierRouter from "./Supplier/supplier.routes.js";
import authRouter from "./auth/auth.routes.js";
import couponRouter from "./coupon/coupon.routes.js";
import logRouter from "./log/log.routes.js";
import shippingCompanyRouter from "./shipping Company/shippingCompany.routes.js";
import subCategoryRouter from "./subcategories/subCategories.routes.js";
import usersRouter from "./users/users.routes.js";
import statsRouter from "./Stats/stats.routes.js";
export function init(app) {
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/notification", notiticationRouter);
  app.use("/api/v1/customer", customerRouter);
  app.use("/api/v1/product", productRouter);
  app.use("/api/v1/brand", brandRouter);
  app.use("/api/v1/branch", branchRouter);
  app.use("/api/v1/supplier", supplierRouter);
  app.use("/api/v1/shippng", shippingCompanyRouter);
  app.use("/api/v1/category", categoryRouter);
  app.use("/api/v1/sub-category", subCategoryRouter);
  app.use("/api/v1/order", orderRouter);
  app.use("/api/v1/coupon", couponRouter);
  app.use("/api/v1/log", logRouter);
  app.use("/api/v1/supplier-order", supplierOrderRouter);
  app.use("/api/v1/salary", salaryRouter);
  app.use("/api/v1/expense", expensesRouter);
  app.use("/api/v1/capital", capitalRouter);
  app.use("/api/v1/stats", statsRouter);


  app.use("/", (req, res, next) => {
    // res.send("Page Not Found");
   return res.status(404).json({ message: "Page Not Found" });
  });

  app.all("*", (req, res, next) => {
    next(res.status(404).json({ message: "Page Not found" }));
  });
}
