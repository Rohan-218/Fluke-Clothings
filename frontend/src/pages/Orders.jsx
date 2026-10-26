import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

const Orders = () => {
  const { currency, backendUrl } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${backendUrl}/api/order`, { withCredentials: true });

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

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="border-t pt-16">
      <div className="text-2xl">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <p className="py-10 text-center text-gray-500">You haven't placed any orders yet.</p>
      ) : (
        <div>
          {orders.map((order) => (
            <div key={order._id} className="border border-gray-200 rounded-md p-4 sm:p-6 my-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="text-sm font-medium break-all">{order._id}</p>
                  <p className="text-sm text-gray-500 mt-2">Date: {formatDate(order.createdAt)}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-gray-500">Order Status</p>
                  <p className="text-sm font-medium text-green-600">{order.status || "Order Placed"}</p>
                  <p className="text-sm text-gray-500 mt-1">Payment: {order.paymentStatus || "Pending"}</p>
                </div>
              </div>

              {order.items?.map((item, index) => {
                const productImage = Array.isArray(item.image) ? item.image[0] : item.image;

                return (
                  <div key={`${order._id}-${item.productId}-${item.size}-${index}`} className="py-4 border-b last:border-b-0 text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4 sm:gap-6 text-sm">
                      <img className="w-16 h-20 sm:w-20 object-cover" src={productImage || "/placeholder.png"} alt={item.name || "Product"} />
                      <div>
                        <p className="sm:text-base font-medium">{item.name}</p>
                        <p className="mt-2">{currency}{Number(item.price).toFixed(2)}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-gray-500">
                          <p>Quantity: {item.quantity}</p>
                          <p>Size: {item.size}</p>
                        </div>
                      </div>
                    </div>
                    <div className="md:text-right">
                      <p className="text-sm text-gray-500">Item Total</p>
                      <p className="font-medium">{currency}{(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4">
                <div className="text-sm text-gray-500">
                  <p>Payment Method: {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}</p>
                  <p className="mt-1">Delivery Fee: {currency}{Number(order.deliveryFee || 0).toFixed(2)}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-gray-500">Order Total</p>
                  <p className="text-lg font-semibold">{currency}{Number(order.total || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;