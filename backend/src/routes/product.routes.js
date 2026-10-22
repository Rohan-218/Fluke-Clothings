import express from "express";
import * as productController from "../controllers/product.controller.js";
import uploadProductImages from "../middleware/multer.middleware.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const productRouter = express.Router();

/**
 * - @route POST /api/product
 * - Protected route
 * - Only system users/admin can add new products
 */
productRouter.post("/register", uploadProductImages, authMiddleware.systemAuthMiddleware, productController.addProductController);

/** @route GET /api/product */
productRouter.get("/", productController.getProductController);

/** 
 * - @route DELETE /api/product/:productId 
 * - Protected route
 * - Only system users/admin can remove products
*/
productRouter.delete("/:productId", authMiddleware.systemAuthMiddleware, productController.deleteProductController);

/** @route GET /api/product/:productId */
productRouter.get("/:productId", productController.getProductByIdController);

export default productRouter;
