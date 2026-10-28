import express from "express";
import * as userController from "../controllers/user.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const userRouter = express.Router();

/**
 * - @route GET /api/user/list
 * - @desc Get all customers with their order counts (Admin only)
 */
userRouter.get("/list", authMiddleware.systemAuthMiddleware, userController.getUsersController);

/**
 * - @route GET /api/user/profile
 * - @desc Get the authenticated customer's profile
 */
userRouter.get("/profile", authMiddleware.authMiddleware, userController.getUserProfileController);

export default userRouter;