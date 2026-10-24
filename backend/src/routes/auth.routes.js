import express from "express";
import * as authController from "../controllers/auth.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const authRouter = express.Router();

/** @route POST /api/auth/register */
authRouter.post("/register", authController.userRegisterController);

/** @route POST /api/auth/login */
authRouter.post("/login", authController.userLoginController);

/** @route POST /api/auth/logout */
authRouter.post("/logout", authController.userLogoutController);

/** 
 * - @route GET /api/auth/me
 * - For checking authentication
 */
authRouter.get("/me", authMiddleware.authMiddleware, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "User is authenticated",
  });
});

export default authRouter;
