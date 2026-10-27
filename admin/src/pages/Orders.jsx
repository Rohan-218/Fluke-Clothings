import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
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
  const [expandedOrders, setExpandedOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setSearchError("");
      setIsSearchActive(false);

      const response = await axios.get(`${backendUrl}/api/order/list`, {
        withCredentials: true
      });

      if (response.data.success === true) {
        setOrders(response.data.orders || []);
        setExpandedOrders([]);
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

      const response = await axios.get(`${backendUrl}/api/order/${encodeURIComponent(id)}`, {
        withCredentials: true
      });

      if (response.data.success === true && response.data.order) {
        setOrders([response.data.order]);
        setExpandedOrders([response.data.order._id]);
      } else {
        setOrders([]);
        setExpandedOrders([]);
        setSearchError(response.data.message || "Order not found");
      }
    } catch (error) {
      console.error("Search order error:", error.response?.data || error.message);
      setOrders([]);
      setExpandedOrders([]);
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

  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const updateStatus = async (orderId, status) => {
    const currentOrder = orders.find((order) => order._id === orderId);

    if (!currentOrder) {
      toast.error("Order not found");
      return;
    }

    if (currentOrder.status === status) return;

    if (currentOrder.status === "Cancelled") {
      toast.error("A cancelled order cannot be reopened");
      return;
    }

    if (currentOrder.status === "Delivered") {
      toast.error("A delivered order cannot be changed to another status");
      return;
    }

    try {
      setUpdatingOrder(orderId);

      const response = await axios.put(
        `${backendUrl}/api/order/status`,
        { orderId, status },
        { withCredentials: true }
      );

      if (response.data.success === true) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId
              ? { ...order, ...(response.data.order || {}), status }
              : order
          )
        );

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

    if (currentOrder.status === "Cancelled" || currentOrder.status === "Delivered") {
      toast.error("Cannot update the delivery date of a completed or cancelled order");
      return;
    }

    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }

    try {
      setUpdatingDeliveryDate(orderId);

      const response = await axios.put(
        `${backendUrl}/api/order/delivery-date`,
        { orderId, deliveryDate },
        { withCredentials: true }
      );

      if (response.data.success === true) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  ...(response.data.order || {}),
                  estimatedDeliveryDate:
                    response.data.order?.estimatedDeliveryDate || deliveryDate
                }
              : order
          )
        );

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

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
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

  const getPaymentStyle = (status) => {
    if (status === "Paid") return "bg-green-100 text-green-700";
    if (status === "Cancelled" || status === "Failed") return "bg-red-100 text-red-700";
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

  const openDeliveryDatePicker = (orderId) => {
    const input = document.getElementById(`delivery-date-${orderId}`);

    if (!input || input.disabled) return;

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch (error) {
        console.error("Open delivery date picker error:", error);
      }
    }

    input.focus();
    input.click();
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
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const isExpanded = expandedOrders.includes(order._id);
            const totalItems = (order.items || []).reduce(
              (total, item) => total + Number(item.quantity || 0),
              0
            );

            return (
              <div key={order._id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300">
                <button
                  type="button"
                  onClick={() => toggleOrder(order._id)}
                  aria-expanded={isExpanded}
                  aria-controls={`order-details-${order._id}`}
                  className="flex w-full flex-col gap-4 p-4 text-left transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <img src={assets.order_status_icon} alt="" className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-semibold text-gray-800">Order #{order._id}</p>
                      <p className="mt-1 text-sm text-gray-600">{getCustomerName(order.address)}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(order.createdAt)} <span className="mx-1">·</span> {totalItems} {totalItems === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <div className="sm:text-right">
                      <p className="text-base font-semibold text-gray-900">{currency}{Number(order.total || 0).toFixed(2)}</p>
                      <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(order.status)}`}>
                          {order.status || "Order Placed"}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStyle(order.paymentStatus)}`}>
                          Payment: {order.paymentStatus || "Pending"}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
                      <svg
                        className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div id={`order-details-${order._id}`} className="border-t border-gray-200 bg-gray-50/50 p-4 sm:p-5">
                    {/* Delivery Information and Payment Method */}
                    <div className="grid grid-cols-1 gap-4 py-1 sm:grid-cols-2">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="mb-2 text-sm font-semibold text-gray-800">Delivery Information</p>
                        <p className="text-sm text-gray-700">{getCustomerName(order.address)}</p>
                        <p className="mt-1 wrap-break-word text-sm text-gray-500">{getAddress(order.address)}</p>
                        {order.address?.phone && <p className="mt-1 text-sm text-gray-500">Phone: {order.address.phone}</p>}
                        {order.address?.email && <p className="mt-1 break-all text-sm text-gray-500">Email: {order.address.email}</p>}

                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Payment Method</p>
                          <p className="mt-1 text-sm font-medium text-gray-700">
                            {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="mb-4 text-sm font-semibold text-gray-800">Order Summary</p>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-gray-600">Subtotal</p>
                            <p className="text-sm font-medium text-gray-800">{currency}{Number(order.subtotal || 0).toFixed(2)}</p>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-gray-600">Delivery Fee</p>
                            <p className="text-sm font-medium text-gray-800">{currency}{Number(order.deliveryFee || 0).toFixed(2)}</p>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-gray-600">Total Items</p>
                            <p className="text-sm font-medium text-gray-800">{totalItems}</p>
                          </div>

                          <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
                            <p className="text-sm font-semibold text-gray-900">Total Amount</p>
                            <p className="text-base font-semibold text-gray-900">{currency}{Number(order.total || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ordered Products */}
                    <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
                      <p className="mb-3 text-sm font-semibold text-gray-800">Ordered Products</p>
                      <div className="flex flex-col gap-3">
                        {(order.items || []).map((item, index) => {
                          const productImage = Array.isArray(item.image) ? item.image[0] : item.image;

                          return (
                            <div key={`${order._id}-${item.productId}-${item.size}-${index}`} className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                              <img className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-16 sm:w-16" src={productImage || "/placeholder.png"} alt={item.name || "Product"} />
                              <div className="min-w-0 flex-1">
                                <p className="wrap-break-word text-sm font-medium text-gray-800">{item.name || "Product"}</p>
                                <p className="mt-1 text-xs text-gray-500">Size: {item.size || "—"} | Quantity: {item.quantity || 0}</p>
                                <p className="mt-1 text-sm text-gray-700">{currency}{Number(item.price || 0).toFixed(2)} each</p>
                              </div>
                              <p className="shrink-0 text-sm font-semibold text-gray-800">{currency}{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delivery Schedule and Order Status */}
                    <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
                      <div className="flex min-w-0 flex-col gap-4">
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                          <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-700">
                                <img src={assets.delivery_truck} alt="Delivery truck" className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">Delivery Schedule</p>
                                <p className="text-xs text-gray-500">{order.status === "Delivered" ? "Completed delivery" : "Estimated arrival date"}</p>
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${order.status === "Cancelled" ? "bg-red-100 text-red-700" : order.status === "Delivered" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                              {order.status === "Cancelled" ? "Cancelled" : order.status === "Delivered" ? "Delivered" : "In progress"}
                            </span>
                          </div>

                          <div className="p-4">
                            {order.status === "Cancelled" ? (
                              <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
                                <img src={assets.warning_icon} alt="Delivery warning" className="mt-0.5 h-5 w-5 shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">Delivery estimate unavailable</p>
                                  <p className="mt-1 text-xs leading-5 text-red-700">This order has been cancelled, so the delivery date no longer applies.</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-green-100 bg-green-50/70 p-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-green-800">{order.status === "Delivered" ? "DATE DELIVERED" : "CURRENT ESTIMATE"}</p>
                                    <p className="mt-1 text-xl font-semibold text-gray-900">{formatDate(order.status === "Delivered" ? (order.deliveredAt || order.estimatedDeliveryDate) : order.estimatedDeliveryDate)}</p>
                                    {order.status === "Delivered" && <p className="mt-1 text-xs text-green-700">Order marked as delivered.</p>}
                                  </div>

                                  {order.status !== "Delivered" && (
                                    <div className="relative shrink-0">
                                      <input
                                        id={`delivery-date-${order._id}`}
                                        type="date"
                                        value={getDateInputValue(order.estimatedDeliveryDate)}
                                        onChange={(e) => updateDeliveryDate(order._id, e.target.value)}
                                        disabled={updatingDeliveryDate === order._id || order.status === "Cancelled"}
                                        className="pointer-events-none absolute inset-0 h-10 w-10 opacity-0"
                                        aria-label="Choose delivery date"
                                        tabIndex={-1}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => openDeliveryDatePicker(order._id)}
                                        disabled={updatingDeliveryDate === order._id || order.status === "Cancelled"}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-green-200 bg-white text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label="Open delivery date calendar"
                                      >
                                        <img src={assets.calendar_icon} alt="Calendar" className="h-5 w-5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {updatingDeliveryDate === order._id && <p className="mt-2 text-xs text-gray-500">Saving delivery date...</p>}
                                {order.status === "Delivered" && <p className="text-xs text-gray-500">Delivery date cannot be changed after delivery.</p>}
                                {order.status !== "Delivered" && order.status !== "Cancelled" && <p className="text-xs text-gray-500">Click the calendar icon to change the estimated delivery date.</p>}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col gap-3 lg:items-end">
                        <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:max-w-sm">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                              <img src={assets.order_status_icon} alt="Order status" className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">Order Status</p>
                              <p className="text-xs text-gray-500">Manage order progress</p>
                            </div>
                          </div>

                          <label htmlFor={`status-${order._id}`} className="mb-2 block text-sm font-medium text-gray-700">Current status</label>
                          <select
                            id={`status-${order._id}`}
                            value={order.status || "Order Placed"}
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                            disabled={updatingOrder === order._id || order.status === "Cancelled" || order.status === "Delivered"}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60"
                          >
                            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>

                          {updatingOrder === order._id && <p className="mt-2 text-xs text-gray-500">Updating order status...</p>}
                          {order.status === "Cancelled" && <p className="mt-2 text-xs text-red-600">Cancelled orders cannot be reopened.</p>}
                          {order.status === "Delivered" && <p className="mt-2 text-xs text-green-700">This order has been completed.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;