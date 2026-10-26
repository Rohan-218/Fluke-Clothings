import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";

import 'dotenv/config';

import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';

import authRouter from './routes/auth.routes.js';
import productRouter from './routes/product.routes.js';
import cartRouter from './routes/cart.routes.js';
import orderRouter from './routes/order.routes.js';

// App config
const app = express();
const port = process.env.PORT || 3000;
connectDB();
connectCloudinary();

// middlewares
app.use(cors({
  origin: [
    process.env.VITE_ADMIN_URL,
    process.env.VITE_FRONTEND_URL
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(cookieParser());

// Test API
app.get('/', (req,res) => {
    res.send("API IS WORKING")
});

/**
 * API routes
 * /api/auth    - Authentication-related routes (register, login, logout, check authentication)
 * /api/product - Product-related routes (add, list, update, delete products)
 * /api/cart    - Cart-related routes (add product, update product quantity, get user cart)
 */
app.use("/api/auth", authRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);


app.listen(port, "0.0.0.0", () => {
    console.log("Server is running on port : "+ port);
});