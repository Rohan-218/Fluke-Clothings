import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import productModel from "../models/product.model.js";

/**
 * @route POST /api/product/register
 * @desc Register a new product
 */
const addProductController = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;

        if (!name || !description || !price || !category || !subCategory || !sizes) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const image1 = req.files?.image1?.[0] || null;
        const image2 = req.files?.image2?.[0] || null;
        const image3 = req.files?.image3?.[0] || null;
        const image4 = req.files?.image4?.[0] || null;

        const images = [image1, image2, image3, image4].filter(Boolean);

        if (images.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one product image is required"
            });
        }

        const imagesUrl = await Promise.all(
            images.map(async (item) => {
                const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url;
            })
        );

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
            success: true,
            product: {
                _id: product._id,
                name: product.name,
                bestseller: product.bestseller,
                image: product.image
            },
            message: "Product added successfully"
        });

    } catch (error) {
        console.error("Add product error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to add product"
        });
    }
};

/**
 * @route GET /api/product/list
 * @desc Retrieve all products
 */
const getProductController = async (req, res) => {
    try {
        const products = await productModel.find();

        const formattedProducts = products.map((product) => ({
            _id: product._id,
            name: product.name,
            description: product.description,
            bestseller: product.bestseller,
            image: product.image,
            price: product.price,
            category: product.category,
            subCategory: product.subCategory,
            sizes: product.sizes
        }));

        return res.status(200).json({
            success: true,
            products: formattedProducts,
            message: "Products retrieved successfully"
        });

    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve products"
        });
    }
};

/**
 * @route DELETE /api/product/:productId
 * @desc Delete a product and its Cloudinary images
 */
const deleteProductController = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const failedImages = [];

        for (const imageUrl of product.image ?? []) {
            try {
                const url = new URL(imageUrl);
                const parts = url.pathname.split("/").filter(Boolean);
                const uploadIndex = parts.indexOf("upload");

                if (uploadIndex === -1) {
                    console.error("Invalid Cloudinary URL:", imageUrl);
                    failedImages.push(imageUrl);
                    continue;
                }

                const assetParts = parts.slice(uploadIndex + 1);

                while (
                    assetParts.length > 0 &&
                    /^(?:[a-z]_[^/]+|[a-z]{1,3}_[^/]+)(?:,.*)?$/.test(assetParts[0]) &&
                    !/^v\d+$/.test(assetParts[0])
                ) {
                    assetParts.shift();
                }

                if (assetParts.length > 0 && /^v\d+$/.test(assetParts[0])) {
                    assetParts.shift();
                }

                if (assetParts.length > 0) {
                    assetParts[assetParts.length - 1] = assetParts[assetParts.length - 1].replace(/\.[^.]+$/, "");
                }

                const publicId = decodeURIComponent(assetParts.join("/"));

                if (!publicId) {
                    console.error("Could not extract public ID:", imageUrl);
                    failedImages.push(imageUrl);
                    continue;
                }

                console.log("Deleting Cloudinary public ID:", publicId);

                const result = await cloudinary.uploader.destroy(publicId, {
                    resource_type: "image",
                    invalidate: true
                });

                console.log("Cloudinary deletion result:", result);

                if (result.result !== "ok" && result.result !== "not found") {
                    failedImages.push(imageUrl);
                }
            } catch (error) {
                console.error("Image deletion error:", error.message);
                failedImages.push(imageUrl);
            }
        }

        if (failedImages.length > 0) {
            return res.status(500).json({
                success: false,
                message: "Some Cloudinary images could not be deleted.",
                failedImages
            });
        }

        await productModel.findByIdAndDelete(productId);

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully."
        });

    } catch (error) {
        console.error("Delete product error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete product."
        });
    }
};

/**
 * @route GET /api/product/:productId
 * @desc Retrieve a product by ID
 */
const getProductByIdController = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            product: {
                _id: product._id,
                name: product.name,
                description: product.description,
                bestseller: product.bestseller,
                image: product.image,
                price: product.price,
                category: product.category,
                subCategory: product.subCategory,
                sizes: product.sizes
            },
            message: "Product retrieved successfully"
        });

    } catch (error) {
        console.error("Get product by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve product"
        });
    }
};

/**
 * @route PUT /api/product/:productId
 * @desc Update product details
 */
const updateProductController = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const allowedFields = [
            "name",
            "description",
            "price",
            "category",
            "subCategory",
            "sizes",
            "bestseller"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided to update"
            });
        }

        if (updates.price !== undefined) {
            const price = Number(updates.price);

            if (updates.price === "" || !Number.isFinite(price) || price < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Price must be a valid non-negative number"
                });
            }

            updates.price = price;
        }

        if (updates.sizes !== undefined) {
            try {
                if (typeof updates.sizes === "string") {
                    updates.sizes = JSON.parse(updates.sizes);
                }
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Sizes must be valid JSON"
                });
            }

            if (
                !Array.isArray(updates.sizes) ||
                !updates.sizes.every(
                    (size) => typeof size === "string" && size.trim() !== ""
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Sizes must be an array of non-empty strings"
                });
            }
        }

        if (updates.bestseller !== undefined) {
            if (
                updates.bestseller === true ||
                updates.bestseller === "true"
            ) {
                updates.bestseller = true;
            } else if (
                updates.bestseller === false ||
                updates.bestseller === "false"
            ) {
                updates.bestseller = false;
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Bestseller must be true or false"
                });
            }
        }

        Object.assign(product, updates);

        await product.save();

        return res.status(200).json({
            success: true,
            product: {
                _id: product._id,
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                subCategory: product.subCategory,
                sizes: product.sizes,
                bestseller: product.bestseller,
                image: product.image
            },
            message: "Product updated successfully"
        });

    } catch (error) {
        console.error("Update product error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update product"
        });
    }
};

export {
    addProductController,
    getProductController,
    deleteProductController,
    getProductByIdController,
    updateProductController
};