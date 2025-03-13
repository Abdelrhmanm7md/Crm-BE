import { categoryModel } from "../../../database/models/category.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import axios from "axios";
import cron from "node-cron";
import * as dotenv from "dotenv";
dotenv.config();

const createCategory = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  let newCategory = new categoryModel(req.body);
  let addedCategory = await newCategory.save({ context: { query: req.query } });

  res.status(201).json({
    message: "Category has been created successfully!",
    addedCategory,
  });
});

const getAllCategory = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(categoryModel.find(), req.query);

  let results = await ApiFeat.mongooseQuery;
  // if (!results || results.length === 0) {
  //   return res.status(404).json({ message: message_1 });
  // }
  res.json({ message: "Done", results });
});


const getCategoryById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Category = await categoryModel.findById(id);
  let message_1 = "Category not found!";
  if (req.query.lang == "ar") {
    message_1 = "القسم غير موجود";
  }
  if (!Category || Category.length === 0) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: "Done", Category });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updatedCategory = await categoryModel.findByIdAndUpdate(id, req.body, {
    new: true,
    userId: req.userId,
    context: { query: req.query },
  });
  let message_1 = "Couldn't update!  not found!";
  let message_2 = "Category updated successfully!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر التحديث! غير موجود!";
    message_2 = "تم تحديث القسم بنجاح!";
  }
  if (!updatedCategory) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: message_2, updatedCategory });
});
const deleteCategory = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let category = await categoryModel.findById(id);
  let message_1 = "Couldn't delete! Not found!";
  let message_2 = "Category deleted successfully!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر الحذف! غير موجود!";
    message_2 = "تم حذف القسم بنجاح!";
  }

  if (!category) {
    return res.status(404).json({ message: message_1 });
  }

  category.userId = req.userId;
  await category.deleteOne();

  res.status(200).json({ message: message_2 });
});

const fetchAndStoreCategory = async () => {
  try {
    console.log("⏳ Fetching categories from WooCommerce API...");
    let page = 1;
    let allCate = [];
    let totalFetched = 0;
    do {
    const { data } = await axios.get(
      "https://a2mstore.com/wp-json/wc/v3/products/categories",
      {
        params: {
          per_page: 100, // Maximum limit per request (adjust as needed)
          page: page,
          // status: ["any"]
        },
        auth: {
          username: process.env.CONSUMERKEY,
          password: process.env.CONSUMERSECRET,
        },
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.CONSUMERKEY}:${process.env.CONSUMERSECRET}`
            ).toString("base64"),
          "Content-Type": "application/json",
        },
      }
    );
    totalFetched = data.length;
    allCate.push(...data);
    page++;
  } while (totalFetched > 0); 

  console.log(`✅ Fetched ${allCate.length} Categories from WooCommerce`);
    for (const item of allCate) {
      const categoryData = {
        wordPressId: item.id,
        name: item.name,
        slug: item.slug,
        SKU: item.id.toString(),
        suppliers: [],
        createdBy: process.env.WEBSITEADMIN, // Assuming website admin creates the category
      };

      // Check if category already exists by slug or name
      const existingCategory = await categoryModel.findOne({
        wordPressId: item.id,
      });

      if (existingCategory) {
        await categoryModel.findByIdAndUpdate(
          existingCategory._id,
          categoryData,
          {
            userId: `${process.env.WEBSITEADMIN}`,
            context: { query: {} },
          }
        );
        console.log(`✅ Updated Category: ${item.name}`);
      } else {
        await categoryModel.create(categoryData);
        console.log(`✅ Created Category: ${item.name}`);
      }
    }

    console.log("✅ Categories updated successfully!");
  } catch (error) {
    console.error("❌ Error fetching categories:", error.message);
  }
};

// ✅ Schedule the function to run every 6 hours
cron.schedule("* * * * *", () => {
  console.log("🔄 Running scheduled product update...");
  fetchAndStoreCategory();
});

// Call once at startup
fetchAndStoreCategory();

const fetchAllCategory = catchAsync(async (req, res, next) => {
  fetchAndStoreCategory();
  res.json({
    message: "Done",
  });
});
export {
  createCategory,
  getAllCategory,
  getCategoryById,
  deleteCategory,
  updateCategory,
  fetchAllCategory,
};
