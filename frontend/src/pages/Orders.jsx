import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

const Orders = () => {
  const { currency, backendUrl, cartItems, updateQuantity, setCartItems } = useContext(ShopContext);
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/order/`, { withCredentials: true });

      if (response.data.success === true) {
        setOrders(response.data.orders || []);
      } else {
        toast.error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Fetch orders error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Unable to fetch your orders");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    for (const productId of Object.keys(cartItems || {})) {
      for (const size of Object.keys(cartItems[productId] || {})) {
        await updateQuantity(productId, size, 0);
      }
    }

    if (setCartItems) {
      setCartItems({});
    }
  };

  const verifyPayment = async (orderId, clearCartOnSuccess = false) => {
    try {
      setVerifyingPayment(orderId);

      const response = await axios.post(`${backendUrl}/api/order/cashfree/verify`, { orderId }, { withCredentials: true });

      if (response.data.success === true && response.data.paid === true) {
        toast.success("Payment successful!");

        if (clearCartOnSuccess) {
          await clearCart();
        }

        await fetchOrders();

        const params = new URLSearchParams(location.search);
        params.delete("order_id");
        const remainingQuery = params.toString();
        window.history.replaceState({}, document.title, `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${window.location.hash}`);
      } else {
        toast.info(response.data.message || "Payment is not confirmed yet. Please check your order status.");
        await fetchOrders();
      }
    } catch (error) {
      console.error("Payment verification error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Unable to verify payment right now. Please check your orders again.");
      await fetchOrders();
    } finally {
      setVerifyingPayment(null);
    }
  };

  const cancelOrder = async (orderId) => {
    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    try {
      setCancellingOrder(orderId);

      const response = await axios.put(`${backendUrl}/api/order/cancel`, { orderId }, { withCredentials: true });

      if (response.data.success === true) {
        setOrders((prevOrders) => prevOrders.map((order) => order._id === orderId ? { ...order, ...(response.data.order || {}), status: "Cancelled" } : order));
        toast.success(response.data.message || "Order cancelled successfully");
      } else {
        toast.error(response.data.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Cancel order error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Unable to cancel your order");
    } finally {
      setCancellingOrder(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("order_id");

    if (orderId) {
      verifyPayment(orderId, true);
    }
  }, [location.search, backendUrl]);

  const formatDate = (date) => {
    if (!date) return "—";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusStyle = (status) => {
    if (status === "Delivered") return "bg-green-100 text-green-700";
    if (status === "Cancelled") return "bg-red-100 text-red-700";
    if (status === "Shipped" || status === "Out for Delivery") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const canCancelOrder = (status) => ["Order Placed", "Packing"].includes(status || "Order Placed");

  return (
    <div className="border-t pt-16">
      <div className="text-2xl"><Title text1={"MY"} text2={"ORDERS"} /></div>

      {verifyingPayment && <p className="py-4 text-center text-gray-500">Verifying your payment...</p>}

      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <p className="py-10 text-center text-gray-500">You haven't placed any orders yet.</p>
      ) : (
        <div>
          {orders.map((order) => (
            <div key={order._id} className="my-6 rounded-md border border-gray-200 p-4 sm:p-6">
              {/* Order information */}
              <div className="mb-4 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="break-all text-sm font-medium">{order._id}</p>
                  <p className="mt-2 text-sm text-gray-500">Date: {formatDate(order.createdAt)}</p>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm text-gray-500">Order Status</p>
                  <span className={`mt-1 inline-block rounded px-3 py-1 text-sm font-medium ${getStatusStyle(order.status || "Order Placed")}`}>{order.status || "Order Placed"}</span>
                  <p className="mt-2 text-sm text-gray-500">Payment: {order.paymentStatus || "Pending"}</p>

                  {order.paymentMethod?.toLowerCase() === "cashfree" && order.paymentStatus !== "Paid" && order.status !== "Cancelled" && (
                    <button type="button" onClick={() => verifyPayment(order._id)} disabled={verifyingPayment !== null} className="mt-2 rounded border border-black px-3 py-1.5 text-xs font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                      {verifyingPayment === order._id ? "Checking..." : "Check Payment"}
                    </button>
                  )}

                  {/* Estimated delivery date */}
                  {order.status === "Cancelled" ? (
                    <p className="mt-2 text-sm text-red-600">Delivery estimate is no longer applicable.</p>
                  ) : order.estimatedDeliveryDate ? (
                    <p className="mt-2 text-sm text-gray-600">Estimated Delivery: <span className="font-semibold text-gray-800">{formatDate(order.estimatedDeliveryDate)}</span></p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Estimated delivery date will be available once your order is packed.</p>
                  )}
                </div>
              </div>

              {/* Ordered products */}
              {(order.items || []).map((item, index) => {
                const productImage = Array.isArray(item.image) ? item.image[0] : item.image;

                return (
                  <div key={`${order._id}-${item.productId}-${item.size}-${index}`} className="flex flex-col gap-4 border-b py-4 text-gray-700 last:border-b-0 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4 text-sm sm:gap-6">
                      <img className="h-20 w-16 shrink-0 object-cover sm:w-20" src={productImage || "/placeholder.png"} alt={item.name || "Product"} />

                      <div>
                        <p className="font-medium sm:text-base">{item.name || "Product"}</p>
                        <p className="mt-2">{currency}{Number(item.price || 0).toFixed(2)}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-500">
                          <p>Quantity: {item.quantity}</p>
                          <p>Size: {item.size || "—"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right">
                      <p className="text-sm text-gray-500">Item Total</p>
                      <p className="font-medium">{currency}{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}

              {/* Payment and total */}
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-between">
                <div className="text-sm text-gray-500">
                  <p>Payment Method: {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod || "—"}</p>
                  <p className="mt-1">Delivery Fee: {currency}{Number(order.deliveryFee || 0).toFixed(2)}</p>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm text-gray-500">Order Total</p>
                  <p className="text-lg font-semibold">{currency}{Number(order.total || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Cancel order */}
              <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  {order.status === "Cancelled" ? "This order has been cancelled." : order.status === "Delivered" ? "This order has been delivered." : canCancelOrder(order.status) ? "You can cancel this order before it ships." : "This order can no longer be cancelled online."}
                </p>

                {canCancelOrder(order.status) && (
                  <button type="button" onClick={() => cancelOrder(order._id)} disabled={cancellingOrder === order._id} className="w-full rounded border border-red-500 px-5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                    {cancellingOrder === order._id ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;