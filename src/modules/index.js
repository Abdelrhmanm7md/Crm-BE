import inventoryRouter from "./Inventory/inventory.routes.js";
import notiticationRouter from "./Notification/notification.routes.js";
import productRouter from "./Products/products.routes.js";
import authRouter from "./auth/auth.routes.js";
import usersRouter from "./users/users.routes.js";
export function init(app) {
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/notification", notiticationRouter);
  app.use("/api/v1/inventory", inventoryRouter);
  app.use("/api/v1/product", productRouter);


  app.use("/", (req, res, next) => {
    // res.send("Page Not Found");
   return res.status(404).json({ message: "Page Not Found" });
  });

  app.all("*", (req, res, next) => {
    next(res.status(404).json({ message: "Page Not found" }));
  });
}
