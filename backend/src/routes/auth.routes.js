import express from "express";
import * as authController from "../controllers/auth.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const authRouter = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 */
authRouter.post("/register", authController.userRegisterController);

/**
 * @route POST /api/auth/login
 * @desc Login user and set authentication cookie
 */
authRouter.post("/login", authController.userLoginController);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and clear authentication cookie
 */
authRouter.post("/logout", authController.userLogoutController);

/**
 * @route GET /api/auth/me
 * @desc Check whether the user is authenticated
 */
authRouter.get("/me", authMiddleware.authMiddleware,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "User is authenticated",
    });
  }
);

export default authRouter;
