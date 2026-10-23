import userModel from "../models/user.model.js";
import tokenBlackListModel from "../models/blackList.model.js";
import jwt from "jsonwebtoken";

/**
 * - User register controller
 * - POST /api/auth/register
 */
const userRegisterController = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const isExists = await userModel.findOne({ email });

        if (isExists) {
            return res.status(409).json({
                message: "User already exists",
                status: "failed"
            });
        }

        const user = await userModel.create({
            email,
            password,
            name
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        res.cookie("token", token);

        return res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token,
            message: "User registered successfully",
            status: "success"
        });

    } catch (error) {
        
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)
                .map(err => err.message)
                .join(", ");

            return res.status(400).json({
                message,
                status: "failed"
            });
        }

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
};

/**
 * - User login controller
 * - POST /api/auth/login
 */
const userLoginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials",
                status: "failed"
            });
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Invalid credentials",
                status: "failed"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        res.cookie("token", token);

        return res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token,
            message: "User logged in successfully",
            status: "success"
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
};


/**
 * - User logout controller
 * - POST /api/auth/logout
 * - Invalidate the token by adding it to the blacklist
 * - Clear the token cookie
 */
const userLogoutController = async (req, res) => {
    try {
        const token =
            req.cookies?.token ||
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(400).json({
                message: "Token not found",
                status: "failed"
            });
        }

        // Add token to blacklist
        await tokenBlackListModel.create({ token });

        // Clear the token cookie
        res.clearCookie("token");

        return res.status(200).json({
            message: "User logged out successfully",
            status: "success"
        });

    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
};

export {
    userRegisterController,
    userLoginController,
    userLogoutController
};