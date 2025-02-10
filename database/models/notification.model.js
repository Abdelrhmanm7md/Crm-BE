import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
  {
    icon: {
      type: String,
      default: null,
      required: true,
    },
    message: {
        message_en: { type: String , },
        message_ar: { type: String , },
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    isRead:{
      type: Boolean,
      default: false,
      required: true,
    },

  },
  { timestamps: true }
);
notificationSchema.pre('save', async function (next) {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 91);
    const result = await this.constructor.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
    next(); // Proceed to save the new document
  } catch (err) {
    next(err); // Pass the error to the next middleware
  }
});
export const notificationModel = mongoose.model(
  "notitication",
  notificationSchema
);
