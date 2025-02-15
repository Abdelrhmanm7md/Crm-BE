import mongoose from "mongoose";

const branchSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: [true, "name is required"],
      required: true,
      minLength: [2, "too short branch name"],
    },
    collectionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

// branchSchema.pre("save", async function (next) {
//   this.branchCode =
//     "S" +
//     generateUniqueId({
//       length: 4,
//       useLetters: false,
//     });
//   next();
// });

export const branchModel = mongoose.model("branch", branchSchema);
