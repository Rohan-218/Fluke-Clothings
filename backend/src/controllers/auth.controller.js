import userModel from "../models/user.model.js";
import tokenBlackListModel from "../models/blackList.model.js";
import { sendWelcomeEmail, sendResetPasswordEmail } from "../services/email.service.js";
import cookieOptions from "../config/cookieOptions.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * @route POST /api/auth/register
 * @desc Register a new user and send a welcome email
 */
const userRegisterController = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const isExists = await userModel.findOne({ email });

    if (isExists) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await userModel.create({
      email,
      password,
      name,
    });

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message,
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate an existing user and set the authentication cookie
 */
const userLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userModel
      .findOne({ email })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      message: "User logged in successfully",
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route POST /api/auth/logout
 * @desc Log out the current user, blacklist the token, and clear the authentication cookie
 */
const userLogoutController = async (req, res) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not found",
      });
    }

    jwt.verify(token, process.env.JWT_SECRET);

    const alreadyBlacklisted = await tokenBlackListModel.findOne({
      token,
    });

    if (!alreadyBlacklisted) {
      await tokenBlackListModel.create({ token });
    }

    const { maxAge, ...clearOptions } = cookieOptions;

    res.clearCookie("token", clearOptions);

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    const { maxAge, ...clearOptions } = cookieOptions;
    res.clearCookie("token", clearOptions);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route POST /api/auth/forgot-password
 * @desc Controller for forgot password api
 */
const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await userModel
      .findOne({ email: normalizedEmail })
      .select("+resetPasswordToken +resetPasswordExpires");

    const message =
      "If an account exists with this email, a password reset link will be sent.";

    if (!user) {
      return res.status(200).json({ success: true, message });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl =
      `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendResetPasswordEmail(user.email, user.name, resetUrl);
    } catch (emailError) {
      console.error("Password reset email failed:", emailError.message);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
    }

    return res.status(200).json({ success: true, message });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process the request right now",
    });
  }
};

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Controller to reset-password
 */
const resetPasswordController = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (
      !token ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid token and password of at least 6 characters are required",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await userModel
      .findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      })
      .select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or has expired",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password right now",
    });
  }
};

/**
 * @route GET /api/auth/me
 * @desc Authenticate user token
 */
const getCurrentUserController = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "User is authenticated"
    });
  } catch (error) {
    console.error("User Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  userRegisterController,
  userLoginController,
  userLogoutController,
  forgotPasswordController,
  resetPasswordController,
  getCurrentUserController
};