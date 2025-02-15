import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        unique: [true, 'name is required'],
        required: true,
        minLength: [2, 'too short category name']
    },
    suppliers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "supplier",
            required: true,
        },
      ],
}, { timestamps: true })



export const categoryModel=mongoose.model('category',categorySchema)



