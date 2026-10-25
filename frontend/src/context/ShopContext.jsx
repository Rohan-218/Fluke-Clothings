import { createContext, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const ShopContext = createContext();

const getCartFromCookie = () => {
  try {
    const cartCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("cartItems="));

    if (!cartCookie) return {};

    const cartData = JSON.parse(
      decodeURIComponent(cartCookie.substring("cartItems=".length))
    );

    return cartData &&
      typeof cartData === "object" &&
      !Array.isArray(cartData)
      ? cartData
      : {};
  } catch (error) {
    console.error("Error reading cart cookie:", error);
    return {};
  }
};

const saveCartToCookie = (cartItems) => {
  try {
    const encodedCart = encodeURIComponent(JSON.stringify(cartItems));
    const secure =
      window.location.protocol === "https:" ? "; Secure" : "";

    document.cookie = `cartItems=${encodedCart}; Max-Age=2592000; Path=/; SameSite=Lax${secure}`;
  } catch (error) {
    console.error("Error saving cart cookie:", error);
  }
};

const ShopContextProvider = ({ children }) => {
  const currency = "₹";
  const delivery_fee = 70;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState(() => getCartFromCookie());

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/auth/me`, {
        withCredentials: true,
      });

      const authenticated = response.data.status === "success";

      setIsAuthenticated(authenticated);
      return authenticated;
    } catch (error) {
      setIsAuthenticated(false);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/product/list`
        );

        if (response.data.status === "success") {
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

  useEffect(() => {
    saveCartToCookie(cartItems);
  }, [cartItems]);

  const addToCart = (itemId, size) => {
    if (authLoading) {
      toast.info("Checking your login status. Please try again.");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Please log in to add products to your cart.");
      return;
    }

    if (!size) {
      toast.error("Please select a size before adding to cart", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setCartItems((previous) => {
      const cartData = structuredClone(previous);

      if (cartData[itemId]) {
        cartData[itemId][size] =
          (Number(cartData[itemId][size]) || 0) + 1;
      } else {
        cartData[itemId] = { [size]: 1 };
      }

      return cartData;
    });

    toast.success("Product added to cart");
  };

  const updateQuantity = (itemId, size, quantity) => {
    setCartItems((previous) => {
      const cartData = structuredClone(previous);

      if (!cartData[itemId] || !cartData[itemId][size]) {
        return previous;
      }

      if (quantity <= 0) {
        delete cartData[itemId][size];

        if (Object.keys(cartData[itemId]).length === 0) {
          delete cartData[itemId];
        }
      } else {
        cartData[itemId][size] = Math.floor(Number(quantity));
      }

      return cartData;
    });
  };

  const getCartCount = () => {
    let totalCount = 0;

    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        totalCount += Number(cartItems[itemId][size]) || 0;
      }
    }

    return totalCount;
  };

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
    checkAuth,
    setIsAuthenticated,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
