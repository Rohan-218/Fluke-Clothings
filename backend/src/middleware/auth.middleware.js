import userModel from "../models/user.model.js";
import tokenBlackListModel from "../models/blackList.model.js";
import jwt from "jsonwebtoken";

const getToken = (req) => {
  const authorization = req.headers.authorization;

  return (
    req.cookies?.token ||
    (authorization?.startsWith("Bearer ")
      ? authorization.split(" ")[1]
      : null)
  );
};

const authenticateToken = async (req, res) => {
  const token = getToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return null;
  }

  try {
    const isBlacklisted = await tokenBlackListModel.findOne({
      token,
    });

    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: "Token is blacklisted. Please log in again.",
      });

      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel
      .findById(decoded.userId)
      .select("+systemUser");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });

      return null;
    }

    return user;
  } catch (error) {
    console.error("Token authentication error:", error.message);

    res.status(401).json({
      success: false,
      message: "Invalid token or authentication error",
    });

    return null;
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const user = await authenticateToken(req, res);

    if (!user) return;

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const systemAuthMiddleware = async (req, res, next) => {
  try {
    const user = await authenticateToken(req, res);

    if (!user) return;

    if (!user.systemUser) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("System authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  authMiddleware,
  systemAuthMiddleware,
};