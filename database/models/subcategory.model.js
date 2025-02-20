import mongoose from "mongoose";

const subCategorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: [true, "name is required"],
      trim: true,
      required: true,
      minLength: [2, "too short subCategory name"],
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: "category",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

subCategorySchema.pre("save", async function (next) {
  await logModel.create({
    user: this.createdBy, // assuming you have a createdBy field
    action: "create subCategory",
    targetModel: "subCategory",
    targetId: this._id,
    after: this.toObject(),
  });
  next();
});

subCategorySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const subCategoryId = this.getQuery()._id || this.getQuery().id;
  const actionBy = this.options.userId; // ✅ Get userId from query options

  if (!subCategoryId) return next();

  const beforeUpdate = await this.model.findById(subCategoryId).lean();
  if (!beforeUpdate) return next(); // If subCategory doesn't exist, skip logging

  try {
    await logModel.create({
      user: actionBy, // Store the user who performed the update
      action: "update subCategory",
      targetModel: "subCategory",
      targetId: subCategoryId,
      before: beforeUpdate,
      after: update, // Stores the update object only (not the full document)
    });
  } catch (error) {
    console.error("Error logging subCategory update:", error);
  }

  next();
});

subCategorySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const actionBy = this.userId; // ✅ Attach userId manually

    await logModel.create({
      user: actionBy,
      action: "delete subCategory",
      targetModel: "subCategory",
      targetId: this._id,
      before: this.toObject(),
    });

    next();
  }
);

export const subCategoryModel = mongoose.model(
  "subCategory",
  subCategorySchema
);
