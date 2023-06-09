const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32,
        text: true // so can query db
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true,  // so can query db base on slug
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000,
        text: true, // can query db base on desc
    },
    price: {
        type: Number,
        required: true,
        trim: true,
        maxlength: 32,
    },
    category: {
        type: ObjectId,
        ref: "Category",  // refer to category modal
    },
    subs: [
        {
            type: ObjectId,
            ref: "Sub",
        },
    ],
    quantity: Number,
    sold: {
        type: Number,
        default: 0
    },
    images: {
        type: Array
    },
    shipping: {
        type: String,
        enum: ["Yes", "No"],
    },
    color: {
        type: String,
        enum: ["Black", "Brown", "Silver", "White", "Blue"],
    },
    brand: {
        type: String,
        enum: ["Apple", "Samsung", "Microsoft", "Lenovo", "Asus", "HP", "Toshiba"],
    },
    ratings: [
        {
            star: Number,
            postedBy:{ type: ObjectId, ref: "User" },

        },
    ],
},
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

