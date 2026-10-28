import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const [loading, setLoading] = useState(false);

  const {
    navigate,
    cartItems,
    updateQuantity,
    setCartItems,
    backendUrl,
  } = useContext(ShopContext);

  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;

    setAddress((previousAddress) => ({
      ...previousAddress,
      [name]: value,
    }));
  };

  const clearCart = async () => {
    for (const productId of Object.keys(cartItems)) {
      for (const size of Object.keys(cartItems[productId])) {
        await updateQuantity(productId, size, 0);
      }
    }

    if (setCartItems) {
      setCartItems({});
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (loading) return;

    try {
      if (!cartItems || Object.keys(cartItems).length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      const items = [];

      for (const productId of Object.keys(cartItems)) {
        const sizes = cartItems[productId];

        for (const size of Object.keys(sizes)) {
          const quantity = sizes[size];

          if (quantity > 0) {
            items.push({
              productId,
              size,
              quantity,
            });
          }
        }
      }

      if (items.length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      setLoading(true);

      const response = await axios.post(
        `${backendUrl}/api/order/create`,
        {
          items,
          address,
          paymentMethod: method,
        },
        {
          withCredentials: true,
        }
      );

      if (!response.data.success) {
        toast.error(
          response.data.message || "Failed to place order"
        );
        return;
      }

      if (method === "cashfree") {
        const { paymentSessionId, orderId } = response.data;

        if (!paymentSessionId || !orderId) {
          toast.error(
            "Payment session could not be created. Please contact support if an order was created."
          );
          return;
        }

        if (typeof window.Cashfree !== "function") {
          toast.error(
            "Cashfree Checkout failed to load. Please refresh and try again."
          );
          return;
        }

        const cashfree = window.Cashfree({
          mode:
            import.meta.env.VITE_CASHFREE_ENV === "production"
              ? "production"
              : "sandbox",
        });

        const checkoutResult = await cashfree.checkout({
          paymentSessionId,
          redirectTarget: "_self",
        });

        if (checkoutResult?.error) {
          console.error(
            "Cashfree checkout error:",
            checkoutResult.error
          );

          toast.error(
            "Unable to open Cashfree Checkout. Please try again."
          );
        }

        return;
      }

      await clearCart();

      toast.success("Order placed successfully");
      navigate("/orders");
    } catch (error) {
      console.error(
        "Place order error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t">
      <div className="flex flex-col gap-4 w-full sm:max-w-120">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1="DELIVERY" text2="INFORMATION" />
        </div>

        <div className="flex gap-3">
          <input className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" name="firstName" placeholder="First name" value={address.firstName} onChange={onChangeHandler} required />
          <input className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" name="lastName" placeholder="Last name" value={address.lastName} onChange={onChangeHandler} required />
        </div>

        <input className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="email" name="email" placeholder="Email address" value={address.email} onChange={onChangeHandler} required />
        <input className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" name="street" placeholder="Street" value={address.street} onChange={onChangeHandler} required />

        <div className="flex gap-3">
          <input className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" name="city" placeholder="City" value={address.city} onChange={onChangeHandler} required />
          <input className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" name="state" placeholder="State" value={address.state} onChange={onChangeHandler} required />
        </div>

        <div className="flex gap-3">
          <input className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" name="zipcode" placeholder="Zipcode" value={address.zipcode} onChange={onChangeHandler} required />
          <input className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" name="country" placeholder="Country" value={address.country} onChange={onChangeHandler} required />
        </div>

        <input className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="tel" name="phone" placeholder="Phone number" value={address.phone} onChange={onChangeHandler} required />
      </div>

      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1="PAYMENT" text2="METHOD" />

          <div className="flex flex-col gap-3 lg:flex-row">
            <div role="radio" aria-checked={method === "cashfree"} onClick={() => setMethod("cashfree")} className="flex items-center gap-3 border p-2 px-3 cursor-pointer">
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === "cashfree" ? "bg-green-400" : ""}`} />
              <img className="h-5 mx-4 py-0.5" src={assets.cashfree_logo} alt="Cashfree" />
            </div>

            <div role="radio" aria-checked={method === "cod"} onClick={() => setMethod("cod")} className="flex items-center gap-3 border p-2 px-3 cursor-pointer">
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === "cod" ? "bg-green-400" : ""}`} />
              <p className="text-gray-500 text-sm font-medium mx-4">CASH ON DELIVERY</p>
            </div>
          </div>

          <div className="w-full text-end mt-8">
            <button type="submit" disabled={loading} className="bg-black text-white px-16 py-3 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{loading ? method === "cashfree" ? "OPENING CHECKOUT..." : "PLACING ORDER..." : method === "cashfree" ? "PROCEED TO PAYMENT" : "PLACE ORDER"}</button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;