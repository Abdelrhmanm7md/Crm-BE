import { expensesModel } from "../../../database/models/expenses.model.js";
import { productModel } from "../../../database/models/product.model.js";
import { supplierModel } from "../../../database/models/supplier.model.js";
import { supplierOrderModel } from "../../../database/models/supplierOrder.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";

const createSupplierOrder = catchAsync(async (req, res, next) => {  
  try {
      req.body.createdBy = req.user._id;
      const supplier = await supplierModel.findById(req.body.supplier);

      if (!supplier) {
        throw new Error("Supplier order not found.");
      }

      let newSupplierOrder = new supplierOrderModel(req.body);
      let addedSupplierOrder = await newSupplierOrder.save({ context: { query: req.query } });
      addedSupplierOrder = JSON.parse(JSON.stringify(addedSupplierOrder));
      addedSupplierOrder.productVariations = addedSupplierOrder.productVariations || [];

      for (const variation of addedSupplierOrder.productVariations) {
        const product = await productModel.findById(variation.product);
        if (!product) continue; 

        if (!Array.isArray(product.productVariations)) {
          product.productVariations = [];
        }

        const existingVariation = product.productVariations.find(
          (v) =>
            v.color === variation.color &&
            JSON.stringify(v.size) === JSON.stringify(variation.size) &&
            v.branch.toString() === variation.branch.toString()
        );

        if (existingVariation) {
          existingVariation.quantity += variation.quantity;
          existingVariation.costPrice = variation.costPrice;
        } else {
          product.productVariations.push({
            costPrice: variation.costPrice,
            sellingPrice: null,
            salePrice: null,
            quantity: variation.quantity,
            photo: variation.photo,
            color: variation.color,
            size: variation.size,
            weight: variation.weight,
            dimensions: variation.dimensions,
            branch: variation.branch,
          });
        }

        product.totalQuantity += variation.quantity;
        product.supplierOrderAt = new Date(addedSupplierOrder.createdAt);
        product.supplier = supplier._id;
        await product.save();
      }      

      req.body.paidPayment = 0;

      if (Array.isArray(req.body.timeTablePayment)) {
        const paidDays = {}; 
      
        for (const payment of req.body.timeTablePayment) {
          req.body.paidPayment += payment.amount || 0;
      
          const date = new Date(payment.date);
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const day = date.getDate().toString().padStart(2, "0");
      
          const dayKey = `${year}-${month}-${day}`;
          paidDays[dayKey] = (paidDays[dayKey] || 0) + payment.amount; // ✅ Sum payments per day
        }
      
        for (const dayKey of Object.keys(paidDays)) {
          const [year, month, day] = dayKey.split("-");
          const expenseDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
      
            await expensesModel.create({
              reason: `Supplier Order Payment - ${order.supplier}`,
              description: `Supplier Order #${order._id} - ${year}-${month}-${day}`,
              type: "out",
              amount: paidDays[dayKey], // ✅ Total for that day
              createdBy: req.user._id,
              createdAt: expenseDate, // ✅ Store the exact payment date
            });
        }
      }      

      req.body.remainingPayment = req.body.totalAmount - req.body.paidPayment;
      if (req.body.paidPayment > req.body.totalAmount) {
          return res.status(400).json({ message: "paidPayment should be less than totalAmount" });
      }

      res.status(201).json({
          message: "SupplierOrder has been created successfully!",
          addedSupplierOrder,
      });
  } catch (error) {
      next(error);
  }
});


const getAllSupplierOrder = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(supplierOrderModel.find(), req.query)

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });

});


const getSupplierOrderById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let SupplierOrder = await supplierOrderModel.findById(id);
  let message_1 = "No SupplierOrder was found!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم العثور على عميل!"
  }
  if (!SupplierOrder || SupplierOrder.length === 0) {
    return res.status(404).json({ message: message_1 });
  }


  res.status(200).json({ message: "Done", SupplierOrder });
});
const updateSupplierOrder = catchAsync(async (req, res, next) => {
  let message_1 = "Couldn't update! Not found!";
  let message_2 = "Supplier Order updated successfully!";

  if (req.query.lang === "ar") {
    message_1 = "تعذر التحديث! غير موجود!";
    message_2 = "تم تحديث طلب المورد بنجاح!";
  }

  const order = await supplierOrderModel.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: message_1 });
  }

  try {
    const { timeTablePayment } = req.body;

    if (timeTablePayment) {
      req.body.paidPayment = 0;
      const paidDays = {}; // ✅ Track payments by exact day
    
      for (const payment of timeTablePayment) {
        req.body.paidPayment += payment.amount || 0;
    
        if (payment.date) {
          const date = new Date(payment.date);
          const dayKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
          paidDays[dayKey] = (paidDays[dayKey] || 0) + payment.amount; // ✅ Sum payments per day
        }
      }
    
      req.body.remainingPayment = order.totalAmount - req.body.paidPayment;
    
      if (req.body.paidPayment > order.totalAmount) {
        return res.status(400).json({ message: "paidPayment should be less than totalAmount" });
      }
    
      for (const dayKey of Object.keys(paidDays)) {
        const [year, month, day] = dayKey.split("-");
    
        // ✅ Check if expense already exists for this exact day
        const existingExpense = await expensesModel.findOne({
          reason: `Supplier Order Payment - ${order.supplier}`,
          description: `Supplier Order #${order._id} - ${year}-${month}-${day}`,
        });
    
        if (!existingExpense) {
          await expensesModel.create({
            reason: `Supplier Order Payment - ${order.supplier}`,
            description: `Supplier Order #${order._id} - ${year}-${month}-${day}`,
            type: "out",
            amount: paidDays[dayKey], // ✅ Daily payment amount
            createdBy: req.user._id,
          });
        }
      }
    }    
    const updatedOrder = await supplierOrderModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, userId: req.userId, context: { query: req.query } }
    );

    res.status(200).json({ message: message_2, updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


const deleteSupplierOrder = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  
  let customer = await supplierOrderModel.findById(id);
  let message_1 = "Couldn't delete! Not found!"
  let message_2 = "SupplierOrder deleted successfully!"
  if(req.query.lang == "ar"){
    message_1 = "لم يتم الحذف! غير موجود!"
    message_2 = "تم حذف طلب المورد بنجاح!"
  }
  if (!customer) {
    return res.status(404).json({ message: message_1 });
  }

  customer.userId = req.userId;
  await customer.deleteOne();

  res.status(200).json({ message: message_2 });
});

export {
  createSupplierOrder,
  getAllSupplierOrder,
  getSupplierOrderById,
  deleteSupplierOrder,
  updateSupplierOrder,
};
