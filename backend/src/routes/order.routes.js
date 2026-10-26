import express from "express";
import * as orderController from "../controllers/order.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const orderRouter = express.Router();

/**
 * @route POST /api/order/create
 * @desc Create order for authenticated user
 */
orderRouter.post("/create", authMiddleware.authMiddleware, orderController.createOrderController);

/**
 * @route GET /api/order
 * @desc Get authenticated user's orders
 */
orderRouter.get("/", authMiddleware.authMiddleware, orderController.getUserOrdersController);

/**
 * @route GET /api/order/:orderId
 * @desc Get a specific order belonging to authenticated user
 */
orderRouter.get("/:orderId", authMiddleware.authMiddleware, orderController.getOrderByIdController);

export default orderRouter;
