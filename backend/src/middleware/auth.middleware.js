import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import tokenBlackListModel from "../models/blackList.model.js";

const authMiddleware = async (req, res, next) => {
    const token =
        req.cookies?.token ||
        req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {
        const isBlacklisted = await tokenBlackListModel.findOne({ token });

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Token is blacklisted, please login again"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        req.user = user;
        return next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid token or authentication error"
        });
    }
};

const systemAuthMiddleware = async (req, res, next) => {
    const token =
        req.cookies?.token ||
        req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {
        const isBlacklisted = await tokenBlackListModel.findOne({ token });

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Token is blacklisted, please login again"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel
            .findById(decoded.userId)
            .select("+systemUser");

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Access denied, not a system user"
            });
        }

        req.user = user;
        return next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid token or authentication error"
        });
    }
};

export {
    authMiddleware,
    systemAuthMiddleware
};