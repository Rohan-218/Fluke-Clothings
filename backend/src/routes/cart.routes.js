import express from "express";
import * as cartController from "../controllers/cart.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const cartRouter = express.Router();

/**
 * @route POST /api/cart/add
 * @desc Add product to cart
 */
cartRouter.post("/add", authMiddleware.authMiddleware, cartController.addToCartController);

/**
 * @route PATCH /api/cart/update
 * @desc Update product quantity in cart
 */
cartRouter.patch("/update", authMiddleware.authMiddleware, cartController.updateCartController);

/**
 * @route GET /api/cart
 * @desc Get user's cart
 */
cartRouter.get("/", authMiddleware.authMiddleware, cartController.getUserCartController);

export default cartRouter;
