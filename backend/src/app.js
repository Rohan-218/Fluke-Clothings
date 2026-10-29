import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import cartRouter from "./routes/cart.routes.js";
import orderRouter from "./routes/order.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();

const allowedOrigins = [
  process.env.ADMIN_URL,
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map((url) => url.replace(/\/+$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin.replace(/\/+$/, ""))
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).send("API IS WORKING");
});

app.get("/health", (req, res) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  res.status(isDatabaseConnected ? 200 : 503).json({
    success: isDatabaseConnected,
    message: isDatabaseConnected
      ? "API and database are healthy"
      : "Database connection is unavailable",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/user", userRouter);

export default app;