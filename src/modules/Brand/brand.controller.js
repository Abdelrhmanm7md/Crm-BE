import { brandModel } from "../../../database/models/brand.model.js";
import ApiFeature from "../../utils/apiFeature.js";
import catchAsync from "../../utils/middleWare/catchAsyncError.js";
import axios from "axios";
import cron from "node-cron";
import * as dotenv from "dotenv";
dotenv.config();

const createBrand = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  let newBrand = new brandModel(req.body);
  let addedBrand = await newBrand.save({ context: { query: req.query } });

  res.status(201).json({
    message: "Brand has been created successfully!",
    addedBrand,
  });
});

const getAllBrand = catchAsync(async (req, res, next) => {
  let ApiFeat = new ApiFeature(brandModel.find(), req.query);
  // .pagination()
  // .filter()
  // .sort()
  // .search()
  // .fields();
  //     let message_1 = "No Brand was found!"
  //     if(req.query.lang == "ar"){
  //       message_1 = "لم يتم العثور على العلامة التجارية!"
  //     }
  //  !ApiFeat && res.status(404).json({ message: message_1 });

  let results = await ApiFeat.mongooseQuery;
  res.json({ message: "Done", results });
});


const getBrandById = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let Brand = await brandModel.find({ _id: id });
  let message_1 = " Brand not found!";
  if (req.query.lang == "ar") {
    message_1 = "العلامة التجارية غير موجودة!";
  }
  if (!Brand || Brand.length === 0) {
    return res.status(404).json({ message: message_1 });
  }

  Brand = Brand[0];

  res.status(200).json({ message: "Done", Brand });
});
const updateBrand = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const updatedBrand = await brandModel.findByIdAndUpdate(id, req.body, {
    new: true,
    userId: req.userId,
    context: { query: req.query },
  });
  let message_1 = "Couldn't update! Not found!";
  let message_2 = "Brand updated successfully!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر التحديث! غير موجود!";
    message_2 = "تم تحديث العلامة التجارية بنجاح!";
  }

  if (!updatedBrand) {
    return res.status(404).json({ message: message_1 });
  }

  res.status(200).json({ message: message_2, updatedBrand });
});

const deleteBrand = catchAsync(async (req, res, next) => {
  let { id } = req.params;

  let brand = await brandModel.findById(id);
  let message_1 = "Couldn't delete! Not found!";
  let message_2 = "Brand deleted successfully!";
  if (req.query.lang == "ar") {
    message_1 = "تعذر الحذف! غير موجود!";
    message_2 = "تم حذف العلامة التجارية بنجاح!";
  }
  if (!brand) {
    return res.status(404).json({ message: message_1 });
  }

  brand.userId = req.userId;
  await brand.deleteOne();

  res.status(200).json({ message: message_2 });
});

const fetchAndStoreBrand = async () => {
  try {
    console.log("⏳ Fetching brand from WooCommerce API...");
    let page = 1;
    let allBrands = [];
    let totalFetched = 0;
    do {
    const { data } = await axios.get(
      "https://a2mstore.com/wp-json/wc/v3/products/brands",
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
    allBrands.push(...data);
    page++;
  } while (totalFetched > 0); // Continue fetching until no more products

  console.log(`✅ Fetched ${allBrands.length} brands from WooCommerce`);
    for (const item of allBrands) {
      const BrandData = {
        wordPressId: item.id,
        name: item.name,
        slug: item.slug,
        SKU: item.id.toString(),
        suppliers: [],
        createdBy: process.env.WEBSITEADMIN, // Assuming website admin creates the Brand
      };

      // Check if Brand already exists by slug or name
      const existingBrand = await brandModel.findOne({ wordPressId: item.id });

      if (existingBrand) {
        await brandModel.findByIdAndUpdate(existingBrand._id, BrandData, {
          userId: `${process.env.WEBSITEADMIN}`,
          context: { query: {} },
        });
        console.log(`✅ Updated Brand: ${item.name}`);
      } else {
        await brandModel.create(BrandData);
        console.log(`✅ Created Brand: ${item.name}`);
      }
    }

    console.log("✅ brand updated successfully!");
  } catch (error) {
    console.error("❌ Error fetching brand:", error.message);
  }
};

// ✅ Schedule the function to run every 6 hours
cron.schedule("* * * * *", () => {
  console.log("🔄 Running scheduled product update...");
  fetchAndStoreBrand();
});


const fetchAllBrand = catchAsync(async (req, res, next) => {
  fetchAndStoreBrand();
  res.json({
    message: "Done",
  });
});

export {
  createBrand,
  getAllBrand,
  getBrandById,
  deleteBrand,
  updateBrand,
  fetchAllBrand,
};
