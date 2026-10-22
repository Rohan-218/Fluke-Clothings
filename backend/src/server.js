import express from 'express';
import cors from 'cors';
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
app.use(express.json());
app.use(cors());

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


app.listen(port, () => {
    console.log("Server is running on port : "+ port);
});