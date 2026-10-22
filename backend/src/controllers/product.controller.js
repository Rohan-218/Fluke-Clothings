import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import productModel from "../models/product.model.js";

/**
 * - Product register controller
 * - POST /api/product/register
 */
const addProductController = async (req,res) => {
    try {

        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;
        
        if (!name || !description || !price || !category || !subCategory || !sizes ) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const image1 = req.files?.image1?.[0] || null;
        const image2 = req.files?.image2?.[0] || null;
        const image3 = req.files?.image3?.[0] || null;
        const image4 = req.files?.image4?.[0] || null;

        const images = [image1, image2, image3, image4].filter(Boolean);

        if (images.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one product image is required'
            });
        }

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, {resource_type:'image'});
                return result.secure_url;
            })
        )

        const product = await productModel.create({
            name,
            description,
            category,
            subCategory,
            price: Number(price),
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            bestseller
        });
        
        return res.status(201).json({
            product: {
                _id: product._id,
                name: product.name,
                bestseller: product.bestseller,
                images: product.image
            },
            message: "Product added successfully",
            status: "success"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    
};

/**
 * - Product listing controller
 * - GET /api/product/
 */
const getProductController = async (req, res) => {
    try {
        const products = await productModel.find();

        const formattedProducts = products.map((product) => ({
            _id: product._id,
            name: product.name,
            bestseller: product.bestseller,
            images: product.image,
            price: product.price
        }));

        return res.status(200).json({
            products: formattedProducts,
            message: "Products retrieved successfully",
            status: "success"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to retrieve products",
            status: "error"
        });
    }
};

/**
 * - Product deleting controller
 * - DELETE /api/product/:productId
 */


const deleteProductController = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                message: "Invalid product ID",
                status: "error"
            });
        }

        const deletedProduct = await productModel.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({
                message: "Product not found",
                status: "error"
            });
        }

        return res.status(200).json({
            message: "Product deleted successfully",
            status: "success"
        });

    } catch (error) {
        console.error("Delete product error:", error);

        return res.status(500).json({
            message: "Failed to delete product",
            status: "error"
        });
    }
};


/**
 * - Get product by ID
 * - GET /api/product/:productId
 */
const getProductByIdController = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                message: "Invalid product ID",
                status: "error"
            });
        }

        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                status: "error"
            });
        }

        return res.status(200).json({
            product: {
                _id: product._id,
                name: product.name,
                bestseller: product.bestseller,
                images: product.image,
                price: product.price
            },
            message: "Product retrieved successfully",
            status: "success"
        });

    } catch (error) {
        console.error("Get product by ID error:", error);

        return res.status(500).json({
            message: "Failed to retrieve product",
            status: "error"
        });
    }
};

export {
    addProductController,
    getProductController,
    deleteProductController,
    getProductByIdController
}; 