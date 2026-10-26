import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

const DELIVERY_FEE = 70;

/**
 * Create order for authenticated user
 * POST /api/order/create
 */
const createOrderController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, address, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your order must contain at least one item",
      });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const { productId, size, quantity } = item;

      if (
        !mongoose.isValidObjectId(productId) ||
        typeof size !== "string" ||
        !size.trim() ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order item",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart no longer exists",
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price",
        });
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        image: Array.isArray(product.image)
          ? product.image[0]
          : product.image,
        price,
        size,
        quantity,
      });

      subtotal += price * quantity;
    }

    const deliveryFee = DELIVERY_FEE;
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      userId,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      address,
      paymentMethod: paymentMethod || "COD",
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to place order",
    });
  }
};

/**
 * Get authenticated user's orders
 * GET /api/order
 */
const getUserOrdersController = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get user orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
    });
  }
};

/**
 * Get a specific order belonging to the authenticated user
 * GET /api/order/:orderId
 */
const getOrderByIdController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order",
    });
  }
};

export {
  createOrderController,
  getUserOrdersController,
  getOrderByIdController,
};
