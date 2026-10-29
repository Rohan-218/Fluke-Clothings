import userModel from "../models/user.model.js";
import tokenBlackListModel from "../models/blackList.model.js";
import { sendWelcomeEmail } from "../services/email.service.js";
import cookieOptions from "../config/cookieOptions.js";
import jwt from "jsonwebtoken";

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
  getCurrentUserController
};