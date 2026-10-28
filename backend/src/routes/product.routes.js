import express from "express";
import * as productController from "../controllers/product.controller.js";
import uploadProductImages from "../middleware/multer.middleware.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const productRouter = express.Router();

/**
 * @route POST /api/product/register
 * @desc Add a new product
 * @access Protected - System users/admin only
 */
productRouter.post("/register", uploadProductImages, authMiddleware.systemAuthMiddleware, productController.addProductController);

/**
 * @route GET /api/product/list
 * @desc Get all products
 * @access Public
 */
productRouter.get("/list", productController.getProductController);

/**
 * @route DELETE /api/product/:productId
 * @desc Delete a product by ID
 * @access Protected - System users/admin only
 */
productRouter.delete("/:productId", authMiddleware.systemAuthMiddleware, productController.deleteProductController);

/**
 * @route GET /api/product/:productId
 * @desc Get a single product by ID
 * @access Public
 */
productRouter.get("/:productId", productController.getProductByIdController);

/**
 * @route PUT /api/product/:productId
 * @desc Update product details
 * @access Protected - System users/admin only
 */
productRouter.put("/:productId", authMiddleware.systemAuthMiddleware, productController.updateProductController);

export default productRouter;
