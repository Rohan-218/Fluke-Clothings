import mongoose from "mongoose";
import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import cashfree from "../config/cashfree.js";

const DELIVERY_FEE = 70;

const updateFailedCashfreeInitialization = async (orderId) => {
  return orderModel.updateOne(
    {
      _id: orderId,
      paymentMethod: "cashfree",
      paymentStatus: "Pending",
      status: { $ne: "Cancelled" },
    },
    {
      $set: { paymentStatus: "Failed" },
    }
  );
};

/**
 * @route POST /api/order/create
 * @desc Create an order and initialize Cashfree payment if selected
 * @access Private
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

    const requiredAddressFields = [
      "firstName",
      "lastName",
      "email",
      "street",
      "city",
      "state",
      "zipcode",
      "country",
      "phone",
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
        message: "Please provide complete delivery information",
      });
    }

    const normalizedPaymentMethod =
      typeof paymentMethod === "string"
        ? paymentMethod.trim().toLowerCase() === "cod"
          ? "COD"
          : paymentMethod.trim().toLowerCase()
        : "";

    const allowedPaymentMethods = ["COD", "cashfree"];

    if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    if (
      normalizedPaymentMethod === "cashfree" &&
      (!process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET)
    ) {
      return res.status(500).json({
        success: false,
        message: "Payment configuration is incomplete",
      });
    }

    let cashfreeCustomerPhone = "";

    if (normalizedPaymentMethod === "cashfree") {
      cashfreeCustomerPhone = address.phone.replace(/\D/g, "").slice(-10);

      if (!/^\d{10}$/.test(cashfreeCustomerPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 10-digit phone number",
        });
      }
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

      const product = await productModel.findById(productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart no longer exists",
        });
      }

      if (!Array.isArray(product.sizes) || !product.sizes.includes(size)) {
        return res.status(400).json({
          success: false,
          message: `Size ${size} is not available for ${product.name}`,
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
          ? product.image[0] || ""
          : product.image || "",
        price,
        size: size.trim(),
        quantity,
      });

      subtotal += price * quantity;
    }

    subtotal = Number(subtotal.toFixed(2));

    const deliveryFee = DELIVERY_FEE;
    const total = Number((subtotal + deliveryFee).toFixed(2));

    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 8);

    const order = await orderModel.create({
      userId,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      address,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: "Pending",
      status: "Order Placed",
      estimatedDeliveryDate,
    });

    if (normalizedPaymentMethod === "cashfree") {
      try {
        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl) {
          console.error("FRONTEND_URL is not configured");

          await updateFailedCashfreeInitialization(order._id);

          return res.status(500).json({
            success: false,
            message: "Payment configuration is incomplete",
            orderId: order._id,
          });
        }

        const customerName =
          `${address.firstName} ${address.lastName}`
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .trim()
            .slice(0, 100) || "Customer";

        const cashfreeRequest = {
          order_id: order._id.toString(),
          order_amount: total,
          order_currency: "INR",
          customer_details: {
            customer_id: userId.toString(),
            customer_name: customerName,
            customer_email: address.email,
            customer_phone: cashfreeCustomerPhone,
          },
          order_meta: {
            return_url: `${frontendUrl.replace(/\/$/, "")}/orders?order_id={order_id}`,
          },
        };

        const cashfreeResponse = await cashfree.PGCreateOrder(cashfreeRequest);
        const paymentSessionId = cashfreeResponse.data?.payment_session_id;

        if (!paymentSessionId) {
          console.error("Cashfree did not return a payment session ID");

          await updateFailedCashfreeInitialization(order._id);

          return res.status(502).json({
            success: false,
            message: "Unable to initialize Cashfree payment",
            orderId: order._id,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Cashfree payment session created successfully",
          orderId: order._id,
          paymentSessionId,
        });
      } catch (error) {
        console.error(
          "Cashfree order creation error:",
          error.response?.data || error.message
        );

        try {
          await updateFailedCashfreeInitialization(order._id);
        } catch (updateError) {
          console.error(
            "Failed to update Cashfree payment status:",
            updateError.message
          );
        }

        return res.status(502).json({
          success: false,
          message: "Unable to initialize Cashfree payment",
          orderId: order._id,
        });
      }
    }

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
 * @route POST /api/order/cashfree/verify
 * @desc Verify a Cashfree payment with Cashfree's API
 * @access Private
 */
const verifyCashfreePaymentController = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await orderModel.findOne({
      _id: orderId,
      userId: req.user.id,
      paymentMethod: "cashfree",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Cashfree order not found",
      });
    }

    if (order.status === "Cancelled") {
      return res.status(409).json({
        success: false,
        paid: false,
        message: "This order is cancelled. Contact support if you completed payment.",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(200).json({
        success: true,
        paid: true,
        message: "Payment has already been verified",
        order,
      });
    }

    const cashfreeResponse = await cashfree.PGFetchOrder(order._id.toString());
    const cashfreeOrder = cashfreeResponse.data;

    if (cashfreeOrder.order_status !== "PAID") {
      return res.status(200).json({
        success: true,
        paid: false,
        message: "Payment has not been confirmed",
        paymentStatus: order.paymentStatus,
      });
    }

    const cashfreeAmount = Number(cashfreeOrder.order_amount);
    const localAmount = Number(order.total);

    if (
      !Number.isFinite(cashfreeAmount) ||
      !Number.isFinite(localAmount) ||
      cashfreeAmount.toFixed(2) !== localAmount.toFixed(2) ||
      cashfreeOrder.order_currency !== "INR"
    ) {
      console.error("Cashfree payment details mismatch:", order._id.toString());

      return res.status(409).json({
        success: false,
        paid: false,
        message: "Payment details do not match the order",
      });
    }

    const updatedOrder = await orderModel.findOneAndUpdate(
      {
        _id: order._id,
        userId: req.user.id,
        paymentMethod: "cashfree",
        paymentStatus: { $ne: "Paid" },
        status: { $ne: "Cancelled" },
        total: order.total,
      },
      {
        $set: {
          paymentStatus: "Paid",
        },
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!updatedOrder) {
      const latestOrder = await orderModel.findOne({
        _id: order._id,
        userId: req.user.id,
      });

      if (!latestOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (latestOrder.status === "Cancelled") {
        console.error(
          "Cashfree confirmed payment for a cancelled order:",
          latestOrder._id.toString()
        );

        return res.status(409).json({
          success: false,
          paid: false,
          message: "The order was cancelled during verification. Contact support for payment reconciliation.",
        });
      }

      if (latestOrder.paymentStatus === "Paid") {
        return res.status(200).json({
          success: true,
          paid: true,
          message: "Payment has already been verified",
          order: latestOrder,
        });
      }

      return res.status(409).json({
        success: false,
        message: "Order changed during payment verification. Please retry.",
      });
    }

    return res.status(200).json({
      success: true,
      paid: true,
      message: "Payment verified successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Cashfree payment verification error:",
      error.response?.data || error.message
    );

    return res.status(502).json({
      success: false,
      message: "Unable to verify payment right now",
    });
  }
};

/**
 * @route GET /api/order
 * @desc Get authenticated user's orders
 * @access Private
 */
const getUserOrdersController = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel.find({ userId }).sort({ createdAt: -1 });

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
 * @route GET /api/order/:orderId
 * @desc Get a specific order belonging to the authenticated user
 * @access Private
 */
const getOrderByIdController = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await orderModel.findOne({
      _id: orderId,
      userId: req.user.id,
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

/**
 * @route GET /api/order/list
 * @desc Get all orders for admin
 * @access Admin
 */
const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

/**
 * @route PUT /api/order/cancel
 * @desc Cancel an order belonging to the authenticated user
 * @access Private
 */
const cancelOrderController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await orderModel.findOneAndUpdate(
      {
        _id: orderId,
        userId,
        status: { $in: ["Order Placed", "Packing"] },
      },
      [
        {
          $set: {
            status: "Cancelled",
            paymentStatus: {
              $cond: [
                { $eq: ["$paymentStatus", "Paid"] },
                "$paymentStatus",
                "Cancelled",
              ],
            },
          },
        },
      ],
      {
        returnDocument: "after",
      }
    );

    if (!order) {
      const existingOrder = await orderModel.findOne({
        _id: orderId,
        userId,
      });

      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "This order can no longer be cancelled",
      });
    }

    return res.status(200).json({
      success: true,
      message: order.paymentStatus === "Paid"
        ? "Order cancelled. The paid amount requires separate refund handling."
        : "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
};

/**
 * @route PUT /api/order/status
 * @desc Update order status for admin
 * @access Admin
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
      "Cancelled",
    ];

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const previousStatus = order.status || "Order Placed";

    if (previousStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "A cancelled order cannot be reopened",
      });
    }

    if (previousStatus === "Delivered" && status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "A delivered order cannot be changed to another status",
      });
    }

    if (previousStatus === status) {
      return res.status(200).json({
        success: true,
        message: "Order status is already set to this value",
        order,
      });
    }

    const deliveryDaysByStatus = {
      "Order Placed": 8,
      Packing: 7,
      Shipped: 4,
    };

    if (status === "Cancelled") {
      if (order.paymentStatus !== "Paid") {
        order.paymentStatus = "Cancelled";
      }
    } else {
      if (status in deliveryDaysByStatus) {
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + deliveryDaysByStatus[status]);
        order.estimatedDeliveryDate = estimatedDate;
      }

      if (status === "Out for Delivery") {
        order.estimatedDeliveryDate = new Date();
      }

      if (status === "Delivered") {
        const deliveredDate = new Date();
        order.deliveredAt = deliveredDate;
        order.estimatedDeliveryDate = deliveredDate;

        if (order.paymentMethod === "COD") {
          order.paymentStatus = "Paid";
        }
      }
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status and delivery estimate updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

/**
 * @route PUT /api/order/delivery-date
 * @desc Update order delivery date for admin
 * @access Admin
 */
const updateOrderDeliveryDateController = async (req, res) => {
  try {
    const { orderId, deliveryDate } = req.body;

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (
      typeof deliveryDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid delivery date",
      });
    }

    const parsedDate = new Date(`${deliveryDate}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== deliveryDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid delivery date",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot update the delivery date of a cancelled order",
      });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Cannot update the delivery date of a delivered order",
      });
    }

    order.estimatedDeliveryDate = parsedDate;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Estimated delivery date updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update delivery date error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update delivery date",
    });
  }
};

export {
  createOrderController,
  verifyCashfreePaymentController,
  getUserOrdersController,
  getOrderByIdController,
  getAllOrdersController,
  cancelOrderController,
  updateOrderStatusController,
  updateOrderDeliveryDateController,
};