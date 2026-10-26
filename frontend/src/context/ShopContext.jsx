import { createContext, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const currency = "₹";
  const delivery_fee = 70;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);

  const navigate = useNavigate();

  // Get the authenticated user's cart from the backend
  const fetchUserCart = useCallback(async () => {
    setCartLoading(true);

    try {
      const response = await axios.get(`${backendUrl}/api/cart`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setCartItems(response.data.cartData || {});
      } else {
        toast.error(response.data.message || "Failed to load cart");
      }
    } catch (error) {
      console.error("Fetch cart error:", error);
      toast.error(
        error.response?.data?.message || "Failed to load your cart"
      );
    } finally {
      setCartLoading(false);
    }
  }, [backendUrl]);

  // Check authentication and load the user's cart
  const checkAuth = useCallback(async () => {
    setAuthLoading(true);

    try {
      const response = await axios.get(`${backendUrl}/api/auth/me`, {
        withCredentials: true,
      });

      const authenticated = response.data.success === true;

      setIsAuthenticated(authenticated);

      if (authenticated) {
        await fetchUserCart();
      } else {
        setCartItems({});
      }

      return authenticated;
    } catch (error) {
      setIsAuthenticated(false);
      setCartItems({});
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [backendUrl, fetchUserCart]);

  // Check login status when the app loads
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/product/list`
        );

        if (response.data.success === true) {
          setProducts(response.data.products || []);
        } else {
          toast.error(
            response.data.message || "Failed to fetch products"
          );
        }
      } catch (error) {
        console.error("Fetch products error:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch products"
        );
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [backendUrl]);

  // Add a product and its selected size to the cart
  const addToCart = async (itemId, size) => {
    if (authLoading) {
      toast.info("Checking your login status. Please try again.");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Please log in to add products to your cart.");
      navigate("/login");
      return;
    }

    if (!size) {
      toast.error("Please select a size before adding to cart");
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/add`,
        { itemId, size },
        { withCredentials: true }
      );

      if (!response.data.success) {
        toast.error(response.data.message || "Failed to add product");
        return;
      }

      if (response.data.cartData) {
        setCartItems(response.data.cartData);
      } else {
        await fetchUserCart();
      }

      toast.success("Product added to cart");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(
        error.response?.data?.message || "Failed to add product to cart"
      );
    }
  };

  // Update quantity or remove a product-size combination
  const updateQuantity = async (itemId, size, quantity) => {
    if (!isAuthenticated) {
      toast.info("Please log in to update your cart.");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 0
    ) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      const response = await axios.patch(
        `${backendUrl}/api/cart/update`,
        {
          itemId,
          size,
          quantity: parsedQuantity,
        },
        { withCredentials: true }
      );

      if (!response.data.success) {
        toast.error(response.data.message || "Failed to update cart");
        return;
      }

      if (response.data.cartData) {
        setCartItems(response.data.cartData);
      } else {
        await fetchUserCart();
      }
    } catch (error) {
      console.error("Update cart error:", error);
      toast.error(
        error.response?.data?.message || "Failed to update cart"
      );
    }
  };

  // Calculate total quantity of all products in the cart
  const getCartCount = () => {
    let totalCount = 0;

    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        totalCount += Number(cartItems[itemId][size]) || 0;
      }
    }

    return totalCount;
  };

  // Calculate cart subtotal
  const getCartAmount = () => {
    let totalAmount = 0;

    for (const itemId in cartItems) {
      const itemInfo = products.find(
        (product) => String(product._id) === String(itemId)
      );

      if (!itemInfo) continue;

      for (const size in cartItems[itemId]) {
        const quantity = Number(cartItems[itemId][size]) || 0;
        totalAmount += Number(itemInfo.price) * quantity;
      }
    }

    return totalAmount;
  };

  const value = {
    products,
    productsLoading,
    currency,
    delivery_fee,
    backendUrl,
    navigate,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    addToCart,
    updateQuantity,
    getCartCount,
    getCartAmount,
    isAuthenticated,
    authLoading,
    cartLoading,
    checkAuth,
    fetchUserCart,
    setIsAuthenticated,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;