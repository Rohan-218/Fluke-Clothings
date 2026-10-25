import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";

import 'dotenv/config';

import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';

import authRouter from './routes/auth.routes.js';
import productRouter from './routes/product.routes.js';

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
 * - API routes
 * - /api/auth for authentication related routes (register, login, logout)
 * - /api/product
*/
app.use("/api/auth", authRouter);
app.use("/api/product", productRouter)


app.listen(port, "0.0.0.0", () => {
    console.log("Server is running on port : "+ port);
});