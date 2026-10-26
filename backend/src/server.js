import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import "dotenv/config";

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import cartRouter from "./routes/cart.routes.js";
import orderRouter from "./routes/order.routes.js";

/**
 * App configuration
 */
const app = express();
const port = process.env.PORT || 3000;

// Initialize database and Cloudinary connections
connectDB();
connectCloudinary();

/**
 * Middleware configuration
 * - Enable CORS for the admin panel and frontend
 * - Parse incoming JSON request bodies
 * - Parse cookies for authentication
 */
app.use(
  cors({
    origin: [
      process.env.VITE_ADMIN_URL,
      process.env.VITE_FRONTEND_URL,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

/**
 * @route GET /
 * @desc Check whether the API server is running
 * @access Public
 */
app.get("/", (req, res) => {
  res.send("API IS WORKING");
});

/**
 * API routes
 * @route /api/auth
 * @desc Authentication routes (register, login, logout, check authentication)
 *
 * @route /api/product
 * @desc Product routes (add, list, retrieve, delete products)
 *
 * @route /api/cart
 * @desc Cart routes (add products, update quantities, retrieve user cart)
 *
 * @route /api/order
 * @desc Order routes (create orders, retrieve user orders, track specific orders)
 */
app.use("/api/auth", authRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

/**
 * Start the API server
 * Listen on all network interfaces to allow external access
 */
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port: ${port}`);
});