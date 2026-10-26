import userModel from "../models/user.model.js";
import tokenBlackListModel from "../models/blackList.model.js";
import jwt from "jsonwebtoken";

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 */
const userRegisterController = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const isExists = await userModel.findOne({ email });

        if (isExists) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
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

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token,
            message: "User registered successfully"
        });

    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)
                .map(err => err.message)
                .join(", ");

            return res.status(400).json({
                success: false,
                message
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

/**
 * @route POST /api/auth/login
 * @desc Log in an existing user
 */
const userLoginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token,
            message: "User logged in successfully"
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

/**
 * @route POST /api/auth/logout
 * @desc Log out a user and invalidate the token
 */
const userLogoutController = async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token not found"
            });
        }

        await tokenBlackListModel.create({ token });

        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });

        return res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });

    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export {
    userRegisterController,
    userLoginController,
    userLogoutController
};