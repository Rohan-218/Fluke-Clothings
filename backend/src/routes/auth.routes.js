import express from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouter = express.Router();

/** @route POST /api/auth/register */
authRouter.post("/register", authController.userRegisterController);

/** @route POST /api/auth/login */
authRouter.post("/login", authController.userLoginController);

/** @route POST /api/auth/logout */
authRouter.post("/logout", authController.userLogoutController);

export default authRouter;
