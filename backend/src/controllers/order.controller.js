import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

const DELIVERY_FEE = 70;

/**
 * @route POST /api/order/create
 * @desc Create order for authenticated user
 */
const createOrderController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, address, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your order must contain at least one item"
      });
    }

    const requiredAddressFields = [
      "firstName",
      "lastName",
      "email",
      "street",
      "city",
      "state",
      "zipcode",
      "country",
      "phone"
    ];

    if (
      !address ||
      typeof address !== "object" ||
      requiredAddressFields.some(
        (field) =>
          typeof address[field] !== "string" ||
          !address[field].trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide complete delivery information"
      });
    }

    const normalizedPaymentMethod =
      typeof paymentMethod === "string"
        ? paymentMethod.trim().toLowerCase() === "cod"
          ? "COD"
          : paymentMethod.trim().toLowerCase()
        : "";

    const allowedPaymentMethods = ["COD", "stripe", "razorpay"];

    if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
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
          message: "Invalid order item"
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart no longer exists"
        });
      }

      if (
        !Array.isArray(product.sizes) ||
        !product.sizes.includes(size)
      ) {
        return res.status(400).json({
          success: false,
          message: `Size ${size} is not available for ${product.name}`
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price"
        });
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        image: Array.isArray(product.image)
          ? product.image[0] || ""
          : product.image || "",
        price,
        size: size.trim(),
        quantity
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
      paymentMethod: normalizedPaymentMethod
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to place order"
    });
  }
};

/**
 * @route GET /api/order
 * @desc Get authenticated user's orders
 */
const getUserOrdersController = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Get user orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders"
    });
  }
};

/**
 * @route GET /api/order/:orderId
 * @desc Get a specific order belonging to the authenticated user
 */
const getOrderByIdController = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order"
    });
  }
};

/**
 * @route GET /api/order/list
 * @desc Get all orders for admin
 */
const getAllOrdersController = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

/**
 * @route PUT /api/order/cancel
 * @desc Cancel an order belonging to the authenticated user
 */
const cancelOrderController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const cancellableStatuses = ["Order Placed", "Packing"];

    if (!cancellableStatuses.includes(order.status || "Order Placed")) {
      return res.status(400).json({
        success: false,
        message: "This order can no longer be cancelled"
      });
    }

    order.status = "Cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order"
    });
  }
};

/**
 * @route PUT /api/order/status
 * @desc Update order status for admin
 */
const updateOrderStatusController = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const allowedStatuses = [
      "Order Placed",
      "Packing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled"
    ];

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "A cancelled order cannot be changed to another status"
      });
    }

    order.status = status;

    if (status === "Packing") {
      order.estimatedDeliveryDate = new Date(
        Date.now() + 8 * 24 * 60 * 60 * 1000
      );
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });
  }
};

const updateOrderDeliveryDateController = async (req, res) => {
  try {
    const { orderId, deliveryDate } = req.body;

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    if (
      typeof deliveryDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid delivery date"
      });
    }

    const parsedDate = new Date(`${deliveryDate}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== deliveryDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid delivery date"
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot update the delivery date of a cancelled order"
      });
    }

    order.estimatedDeliveryDate = parsedDate;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Estimated delivery date updated successfully",
      order
    });
  } catch (error) {
    console.error("Update delivery date error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update delivery date"
    });
  }
};

export {
  createOrderController,
  getUserOrdersController,
  getOrderByIdController,
  getAllOrdersController,
  cancelOrderController,
  updateOrderStatusController,
  updateOrderDeliveryDateController
};