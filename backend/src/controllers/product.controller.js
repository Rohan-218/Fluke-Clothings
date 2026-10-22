import { v2 as cloudinary } from 'cloudinary';
import productModel from "../models/product.model.js";

/**
 * - Product register controller
 * - POST /api/product/register
 */
const addProductController = async (req,res) => {
    try {

        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;

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
const getAllProductController = async (req,res) => {
    
};

/**
 * - Product deleting/removing controller
 * - DELETE /api/product/
 */
const deleteProductController = async (req,res) => {
    
};

/**
 * - Product deleting/removing controller
 * - GET /api/product/
 */
const getProductByIdController = async (req,res) => {
    
};

export {
    addProductController,
    getAllProductController,
    deleteProductController,
    getProductByIdController
}; 