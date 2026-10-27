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
 * @route PUT /api/order/cancel
 * @desc Cancel an order belonging to the authenticated user
 */
orderRouter.put("/cancel", authMiddleware.authMiddleware, orderController.cancelOrderController);

/**
 * @route GET /api/order/list
 * @desc Get all orders for admin
 */
orderRouter.get("/list", authMiddleware.systemAuthMiddleware, orderController.getAllOrdersController);

/**
 * @route PUT /api/order/status
 * @desc Update order status for admin
 */
orderRouter.put("/status", authMiddleware.systemAuthMiddleware, orderController.updateOrderStatusController);

/**
 * @route GET /api/order/:orderId
 * @desc Get a specific order belonging to authenticated user
 */
orderRouter.get("/:orderId", authMiddleware.systemAuthMiddleware, orderController.getOrderByIdController);

/**
 * @route GET /api/order/delivery-date
 * @desc Update order delivery date
 */
orderRouter.put("/delivery-date", authMiddleware.systemAuthMiddleware, orderController.updateOrderDeliveryDateController);

export default orderRouter;