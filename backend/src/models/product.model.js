import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name : {
        type: String,
        required: [true, "Name is required for adding the product"],
    },
    description: {
        type: String,
        required: [true, "Description is required for adding the product"]
    },
    price: {
        type: Number,
        required: [true, "Price is required for adding the product"]
    },
    image: {
        type: Array,
        required: [true, "Product image is required for adding the product"]
    },
    category: {
        type: String,
        required: [true, "Category is required for adding the product"]
    },
    subCategory: {
        type: String,
        required: [true, "Sub-category is required for adding the product"]
    },
    sizes: {
        type: Array,
        required: [true, "Sizes is required for adding the product"]
    },
    bestseller: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true
});

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;