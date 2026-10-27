import userModel from "../models/user.model.js";

/**
 * Add product to cart
 * POST /api/cart/add
 */
const addToCartController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, size } = req.body;

    if (!itemId || !size) {
      return res.status(400).json({
        success: false,
        message: "Product ID and size are required"
      });
    }

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const cartData = userData.cartData || {};

    if (!cartData[itemId]) {
      cartData[itemId] = {};
    }

    cartData[itemId][size] =
      (Number(cartData[itemId][size]) || 0) + 1;

    userData.markModified("cartData");
    await userData.save();

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cartData: userData.cartData
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product to cart"
    });
  }
};

/**
 * Update product quantity or remove a size
 * PATCH /api/cart/update
 */
const updateCartController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, size, quantity } = req.body;

    if (
      !itemId ||
      !size ||
      quantity === undefined ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID, size, and non-negative integer quantity are required"
      });
    }

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const cartData = userData.cartData || {};

    if (!cartData[itemId] || cartData[itemId][size] === undefined) {
      return res.status(404).json({
        success: false,
        message: "Product size not found in cart"
      });
    }

    if (quantity === 0) {
      delete cartData[itemId][size];

      if (Object.keys(cartData[itemId]).length === 0) {
        delete cartData[itemId];
      }
    } else {
      cartData[itemId][size] = quantity;
    }

    userData.markModified("cartData");
    await userData.save();

    return res.status(200).json({
      success: true,
      message: quantity === 0
        ? "Product removed from cart"
        : "Cart updated successfully",
      cartData: userData.cartData
    });
  } catch (error) {
    console.error("Update cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update cart"
    });
  }
};

/**
 * Get authenticated user's cart
 * GET /api/cart
 */
const getUserCartController = async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      cartData: userData.cartData || {}
    });
  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve cart"
    });
  }
};

export {
  addToCartController,
  updateCartController,
  getUserCartController
};