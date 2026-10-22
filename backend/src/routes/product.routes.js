import express from "express";
import * as productController from "../controllers/product.controller.js";
import uploadProductImages from "../middleware/multer.middleware.js"

const router = express.Router();

/** @route POST /api/product */
router.post("/register", uploadProductImages, productController.addProductController);

/** @route GET /api/product */
router.get("/", productController.getAllProductController);

/** @route DELETE /api/product/productId */
router.delete("/:productId", productController.deleteProductController);

/** @route GET /api/product/productId */
router.get("/:productId", productController.getProductByIdController);

export default router;
