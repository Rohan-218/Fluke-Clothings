import express from "express";
import * as userController from "../controllers/user.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const userRouter = express.Router();

userRouter.get("/list", authMiddleware.systemAuthMiddleware, userController.getUsersController);

export default userRouter;