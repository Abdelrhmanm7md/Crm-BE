import branchRouter from "./Branch/branch.routes.js";
import brandRouter from "./Brand/brand.routes.js";
import categoryRouter from "./Category/category.routes.js";
import inventoryRouter from "./Inventory/inventory.routes.js";
import notiticationRouter from "./Notification/notification.routes.js";
import orderRouter from "./Order/order.routes.js";
import productRouter from "./Products/products.routes.js";
import supplierRouter from "./Supplier/supplier.routes.js";
import authRouter from "./auth/auth.routes.js";
import shippingCompanyRouter from "./shipping Company/shippingCompany.routes.js";
import usersRouter from "./users/users.routes.js";
export function init(app) {
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/notification", notiticationRouter);
  app.use("/api/v1/inventory", inventoryRouter);
  app.use("/api/v1/product", productRouter);
  app.use("/api/v1/brand", brandRouter);
  app.use("/api/v1/branch", branchRouter);
  app.use("/api/v1/supplier", supplierRouter);
  app.use("/api/v1/shippng", shippingCompanyRouter);
  app.use("/api/v1/category", categoryRouter);
  app.use("/api/v1/order", orderRouter);


  app.use("/", (req, res, next) => {
    // res.send("Page Not Found");
   return res.status(404).json({ message: "Page Not Found" });
  });

  app.all("*", (req, res, next) => {
    next(res.status(404).json({ message: "Page Not found" }));
  });
}
