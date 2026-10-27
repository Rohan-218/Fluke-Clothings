import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { backendUrl, currency } from "../App";

const statusOptions = ["Order Placed", "Packing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

const Orders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [updatingDeliveryDate, setUpdatingDeliveryDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setSearchError("");
      setIsSearchActive(false);
      const response = await axios.get(`${backendUrl}/api/order/list`, { withCredentials: true });

      if (response.data.success === true) {
        setOrders(response.data.orders || []);
      } else {
        setOrders([]);
        toast.error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Fetch orders error:", error.response?.data || error.message);
      setOrders([]);
      toast.error(error.response?.data?.message || (error.request ? "Unable to connect to the server." : error.message || "Failed to fetch orders"));
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderById = async (orderId, showToast = true) => {
    const id = orderId.trim();

    if (!id) {
      if (showToast) toast.error("Please enter an order ID");
      return;
    }

    try {
      setSearching(true);
      setSearchError("");
      setIsSearchActive(true);
      const response = await axios.get(`${backendUrl}/api/order/${encodeURIComponent(id)}`, { withCredentials: true });

      if (response.data.success === true && response.data.order) {
        setOrders([response.data.order]);
      } else {
        setOrders([]);
        setSearchError(response.data.message || "Order not found");
      }
    } catch (error) {
      console.error("Search order error:", error.response?.data || error.message);
      setOrders([]);
      const message = error.response?.data?.message || (error.request ? "Unable to connect to the server." : "Failed to retrieve order");
      setSearchError(message);
      if (showToast) toast.error(message);
    } finally {
      setSearching(false);
    }
  };

  const searchOrder = async (e) => {
    e.preventDefault();
    await fetchOrderById(searchTerm);
  };

  const handleRefresh = async () => {
    if (isSearchActive && searchTerm.trim()) {
      await fetchOrderById(searchTerm, false);
    } else {
      await fetchOrders();
    }
  };

  const handleShowAllOrders = () => {
    setSearchTerm("");
    setSearchError("");
    setIsSearchActive(false);
    fetchOrders();
  };

  const updateStatus = async (orderId, status) => {
    const currentOrder = orders.find((order) => order._id === orderId);

    if (currentOrder?.status === "Cancelled" && status !== "Cancelled") {
      toast.error("A cancelled order cannot be reopened");
      return;
    }

    try {
      setUpdatingOrder(orderId);
      const response = await axios.put(`${backendUrl}/api/order/status`, { orderId, status }, { withCredentials: true });

      if (response.data.success === true) {
        setOrders((prev) => prev.map((order) => order._id === orderId ? { ...order, ...(response.data.order || {}), status } : order));
        toast.success(response.data.message || "Order status updated successfully");
      } else {
        toast.error(response.data.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Update order status error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to update order status");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const updateDeliveryDate = async (orderId, deliveryDate) => {
    const currentOrder = orders.find((order) => order._id === orderId);

    if (!currentOrder) {
      toast.error("Order not found");
      return;
    }

    if (currentOrder.status === "Cancelled") {
      toast.error("Cannot update the delivery date of a cancelled order");
      return;
    }

    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }

    try {
      setUpdatingDeliveryDate(orderId);
      const response = await axios.put(`${backendUrl}/api/order/delivery-date`, { orderId, deliveryDate }, { withCredentials: true });

      if (response.data.success === true) {
        setOrders((prev) => prev.map((order) => order._id === orderId ? { ...order, ...(response.data.order || {}), estimatedDeliveryDate: response.data.order?.estimatedDeliveryDate || deliveryDate } : order));
        toast.success(response.data.message || "Delivery date updated successfully");
      } else {
        toast.error(response.data.message || "Failed to update delivery date");
      }
    } catch (error) {
      console.error("Update delivery date error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to update delivery date");
    } finally {
      setUpdatingDeliveryDate(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [location.pathname]);

  const formatDate = (date) => {
    if (!date) return "Not set";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Not set";
    return parsedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getDateInputValue = (date) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "";
    return parsedDate.toISOString().slice(0, 10);
  };

  const getStatusStyle = (status) => {
    if (status === "Delivered") return "bg-green-100 text-green-700";
    if (status === "Cancelled") return "bg-red-100 text-red-700";
    if (status === "Shipped" || status === "Out for Delivery") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getCustomerName = (address) => {
    if (!address) return "Customer";
    if (typeof address === "string") return address;
    return [address.firstName, address.lastName].filter(Boolean).join(" ") || address.name || "Customer";
  };

  const getAddress = (address) => {
    if (!address) return "Address unavailable";
    if (typeof address === "string") return address;
    return [address.street, address.city, address.state, address.zipcode, address.country].filter(Boolean).join(", ") || "Address unavailable";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold">Orders</p>
        <button type="button" onClick={handleRefresh} disabled={loading || searching} className="rounded border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">{searching ? "Refreshing..." : loading ? "Loading..." : "Refresh Orders"}</button>
      </div>

      <form onSubmit={searchOrder} className="flex flex-col gap-2 sm:flex-row">
        <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSearchError(""); }} placeholder="Enter order ID..." className="w-full rounded border border-gray-300 px-4 py-2 text-sm outline-none focus:border-gray-500 sm:max-w-md" />
        <button type="submit" disabled={searching || loading} className="rounded bg-black px-5 py-2 text-sm text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">{searching ? "Searching..." : "Search Order"}</button>
        <button type="button" onClick={handleShowAllOrders} disabled={searching || loading} className="rounded border border-gray-300 px-5 py-2 text-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">Show All Orders</button>
      </form>

      {searchError && <p className="text-sm text-red-600">{searchError}</p>}

      {loading ? (
        <p className="py-8 text-center text-gray-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="py-8 text-center text-gray-500">{isSearchActive ? "No order found for this ID." : "No orders found."}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order._id} className="rounded-md border p-3 sm:p-5">
              <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Order Details</p>
                  <p className="mt-1 break-all text-xs text-gray-500">ID: {order._id}</p>
                  <p className="mt-1 text-xs text-gray-500">Date: {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className={`rounded px-3 py-1 text-xs font-medium ${getStatusStyle(order.status)}`}>{order.status || "Order Placed"}</span>
                  <p className="text-sm text-gray-600">Payment: <span className="font-medium">{order.paymentStatus || "Pending"}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm font-semibold text-gray-800">Delivery Information</p>
                  <p className="text-sm text-gray-700">{getCustomerName(order.address)}</p>
                  <p className="mt-1 wrap-break-word text-sm text-gray-500">{getAddress(order.address)}</p>
                  {order.address?.phone && <p className="mt-1 text-sm text-gray-500">Phone: {order.address.phone}</p>}
                  {order.address?.email && <p className="mt-1 break-all text-sm text-gray-500">Email: {order.address.email}</p>}
                </div>
                <div className="sm:text-right">
                  <p className="mb-1 text-sm font-semibold text-gray-800">Payment Information</p>
                  <p className="text-sm text-gray-600">Method: {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod || "—"}</p>
                  <p className="mt-1 text-sm text-gray-600">Payment Status: {order.paymentStatus || "Pending"}</p>
                  <p className="mt-2 text-base font-semibold text-gray-800">Total: {currency}{Number(order.total || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="mb-3 text-sm font-semibold text-gray-800">Ordered Products</p>
                <div className="flex flex-col gap-3">
                  {(order.items || []).map((item, index) => {
                    const productImage = Array.isArray(item.image) ? item.image[0] : item.image;
                    return (
                      <div key={`${order._id}-${item.productId}-${item.size}-${index}`} className="flex items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0">
                        <img className="h-14 w-14 shrink-0 rounded object-cover sm:h-16 sm:w-16" src={productImage || "/placeholder.png"} alt={item.name || "Product"} />
                        <div className="min-w-0 flex-1">
                          <p className="wrap-break-word text-sm font-medium text-gray-800">{item.name || "Product"}</p>
                          <p className="mt-1 text-xs text-gray-500">Size: {item.size || "—"} | Quantity: {item.quantity || 0}</p>
                          <p className="mt-1 text-sm text-gray-700">{currency}{Number(item.price || 0).toFixed(2)} each</p>
                        </div>
                        <p className="shrink-0 text-sm font-medium text-gray-800">{currency}{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-sm text-gray-500">
                  <p>Delivery Fee: {currency}{Number(order.deliveryFee || 0).toFixed(2)}</p>
                  <p className="mt-1">Items: {(order.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0)}</p>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="flex flex-col gap-2">
                    <label htmlFor={`status-${order._id}`} className="text-sm font-medium text-gray-700">Update Order Status</label>
                    <select id={`status-${order._id}`} value={order.status || "Order Placed"} onChange={(e) => updateStatus(order._id, e.target.value)} disabled={updatingOrder === order._id || order.status === "Cancelled"} className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-52">
                      {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    {updatingOrder === order._id && <p className="text-xs text-gray-500">Updating status...</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-gray-700">Estimated Delivery: <span className="font-normal">{order.status === "Cancelled" ? "Not applicable" : formatDate(order.estimatedDeliveryDate)}</span></p>
                    {order.status === "Cancelled" ? (
                      <p className="text-xs text-red-600">Delivery estimate is no longer applicable.</p>
                    ) : (
                      <>
                        <label htmlFor={`delivery-date-${order._id}`} className="text-sm font-medium text-gray-700">Change Delivery Date</label>
                        <input id={`delivery-date-${order._id}`} type="date" value={getDateInputValue(order.estimatedDeliveryDate)} onChange={(e) => updateDeliveryDate(order._id, e.target.value)} disabled={updatingDeliveryDate === order._id || order.status === "Cancelled"} className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-52" />
                      </>
                    )}
                    {updatingDeliveryDate === order._id && <p className="text-xs text-gray-500">Updating delivery date...</p>}
                  </div>
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
