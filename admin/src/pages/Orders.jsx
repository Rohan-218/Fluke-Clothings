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
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setSearchError("");
      setIsSearchActive(false);

      const response = await axios.get(`${backendUrl}/api/order/list`, { withCredentials: true });

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

  const fetchOrderById = async (searchValue, showToast = true) => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      if (showToast) toast.error("Please enter an order ID or customer name");
      return;
    }

    try {
      setSearching(true);
      setSearchError("");
      setIsSearchActive(true);

      const response = await axios.get(`${backendUrl}/api/order/list`, { withCredentials: true });

      if (response.data.success === true) {
        const allOrders = response.data.orders || [];
        setOrders(allOrders);

        const matchedOrders = allOrders.filter((order) => {
          const orderId = String(order._id || "").toLowerCase();
          const customerName = getCustomerName(order.address).toLowerCase();
          return orderId.includes(query) || customerName.includes(query);
        });

        setExpandedOrders(matchedOrders.length === 1 ? [matchedOrders[0]._id] : []);

        if (matchedOrders.length === 0) setSearchError("No order found for this order ID or customer name.");
      } else {
        setOrders([]);
        setExpandedOrders([]);
        setSearchError(response.data.message || "Failed to search orders");
      }
    } catch (error) {
      console.error("Search order error:", error.response?.data || error.message);
      setOrders([]);
      setExpandedOrders([]);

      const message = error.response?.data?.message || (error.request ? "Unable to connect to the server." : "Failed to retrieve orders");
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
    setStatusFilter("All");
    fetchOrders();
  };

  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) => prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]);
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
    if (status === "Delivered") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    if (status === "Cancelled") return "bg-red-50 text-red-600 ring-1 ring-red-100";
    if (status === "Shipped" || status === "Out for Delivery") return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
    if (status === "Packing") return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
  };

  const getPaymentStyle = (status) => {
    if (status === "Paid") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    if (status === "Cancelled" || status === "Failed") return "bg-red-50 text-red-600 ring-1 ring-red-100";
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
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

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "All" || (order.status || "Order Placed") === statusFilter;
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !isSearchActive || !query || String(order._id || "").toLowerCase().includes(query) || getCustomerName(order.address).toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    All: orders.length,
    ...statusOptions.reduce((counts, status) => {
      counts[status] = orders.filter((order) => (order.status || "Order Placed") === status).length;
      return counts;
    }, {}),
  };

  const totalRevenue = orders.reduce((total, order) => order.status === "Cancelled" ? total : total + Number(order.total || 0), 0);

  const getItemCount = (order) => (order.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0);

  return (
    <div className="min-h-screen space-y-6 rounded-2xl bg-[#f7f8fa] p-3 pb-8 sm:p-5 lg:p-7">
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 p-5 sm:p-7 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-sm">
              <img src={assets.shopping_bag_icon} alt="Shopping bag" className="h-5.75 w-5.75" />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">FLUKE / COMMERCE</p>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Orders</h1>
              <p className="mt-1.5 text-sm leading-5 text-gray-500">Track orders, manage delivery and update fulfillment.</p>
            </div>
          </div>

          <button type="button" onClick={handleRefresh} disabled={loading || searching} className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 lg:self-center">
            <img src={assets.refresh_icon} alt="Refresh" className={`h-4.25 w-4.25 ${loading || searching ? "animate-spin" : ""}`} />
            {searching ? "Searching..." : loading ? "Loading..." : "Refresh Orders"}
          </button>
        </div>

        <div className="grid grid-cols-2 border-t border-gray-100 bg-gray-50/70 sm:grid-cols-3">
          <div className="border-r border-gray-100 px-5 py-4 sm:px-7">
            <p className="text-xs font-medium text-gray-500">Total orders</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{orders.length.toString().padStart(2, "0")}</p>
            <p className="mt-1 text-xs text-gray-400">All order records</p>
          </div>
          <div className="px-5 py-4 sm:border-r sm:border-gray-100 sm:px-7">
            <p className="text-xs font-medium text-gray-500">Active orders</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length.toString().padStart(2, "0")}</p>
            <p className="mt-1 text-xs text-gray-400">Awaiting completion</p>
          </div>
          <div className="col-span-2 hidden px-7 py-4 sm:col-span-1 sm:block">
            <p className="text-xs font-medium text-gray-500">Order value</p>
            <p className="mt-1.5 wrap-break-word text-2xl font-semibold tracking-tight text-gray-900">{currency}{totalRevenue.toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-400">Excludes cancelled orders</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Find an order</h2>
          <p className="mt-1 text-sm text-gray-500">Search by order ID or customer name.</p>
        </div>

        <form onSubmit={searchOrder} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <img src={assets.search_icon} alt="Search" className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2" />
            <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSearchError(""); }} placeholder="Enter order ID or customer name..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100" />
          </div>
          <button type="submit" disabled={searching || loading} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">{searching ? "Searching..." : "Search Orders"}</button>
          <button type="button" onClick={handleShowAllOrders} disabled={searching || loading} className="cursor-pointer rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Show All</button>
        </form>

        {searchError && <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"><img src={assets.alert_icon} alt="" className="mt-0.5 h-4.5 w-4.5 shrink-0" />{searchError}</div>}
      </div>

      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Order Status</h2>
            <p className="mt-1 text-sm text-gray-500">Filter orders by their current fulfillment status.</p>
          </div>
          <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">Showing {filteredOrders.length} of {orders.length}</span>
        </div>

        <div className="flex flex-wrap gap-2 pb-1">
          {["All", ...statusOptions].map((status) => (
            <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition ${statusFilter === status ? "border-gray-900 bg-gray-900 text-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
              {status === "All" ? "All Orders" : status}
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${statusFilter === status ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500"}`}>{statusCounts[status]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-2 px-1 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">{statusFilter === "All" ? "All Orders" : statusFilter}</h2>
            <p className="mt-1 text-sm text-gray-500">Select an order to view its complete details.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[1, 2].map((item) => <div key={item} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex gap-4"><div className="h-12 w-12 animate-pulse rounded-xl bg-gray-100" /><div className="flex-1"><div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" /><div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-gray-100" /><div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-gray-100" /></div></div></div>)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-16 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-50 text-gray-400"><img src={assets.empty_orders_icon} alt="" className="h-8.5 w-8.5" /></div>
            <h3 className="mt-5 text-lg font-semibold text-gray-900">{isSearchActive ? "No matching orders" : "No orders found"}</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">{isSearchActive ? "Try another order ID or customer name, or clear your filters." : "There are no orders for this status yet. New orders will appear here."}</p>
            {(isSearchActive || statusFilter !== "All") && <button type="button" onClick={handleShowAllOrders} className="mt-5 cursor-pointer rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700">View All Orders</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrders.includes(order._id);
              const totalItems = getItemCount(order);

              return (
                <article key={order._id} className={`min-w-0 overflow-hidden rounded-2xl border bg-white transition duration-300 ${isExpanded ? "border-gray-300 shadow-md shadow-gray-200/50 xl:col-span-2" : "border-gray-200/80 shadow-sm hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"}`}>
                  <button type="button" onClick={() => toggleOrder(order._id)} aria-expanded={isExpanded} aria-controls={`order-details-${order._id}`} className="flex w-full cursor-pointer flex-col gap-4 p-4 text-left transition hover:bg-gray-50/70 sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100"><img src={assets.order_status_icon} alt="" className="h-6 w-6 object-contain" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-all text-sm font-semibold text-gray-900">#{order._id}</p>
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500">{totalItems} {totalItems === 1 ? "ITEM" : "ITEMS"}</span>
                        </div>
                        <p className="mt-1.5 wrap-break-word text-sm text-gray-600">{getCustomerName(order.address)}</p>
                        <p className="mt-1 text-xs text-gray-400">Placed on {formatDate(order.createdAt)}</p>
                      </div>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${isExpanded ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-500"}`}>
                        <img src={isExpanded ? assets.white_down_icon : assets.down_icon} alt="" className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${getStatusStyle(order.status)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{order.status || "Order Placed"}</span>
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium ${getPaymentStyle(order.paymentStatus)}`}>{order.paymentStatus || "Pending"}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Order total</p>
                        <p className="mt-0.5 text-xl font-semibold tracking-tight text-gray-900">{currency}{Number(order.total || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div id={`order-details-${order._id}`} className="space-y-5 border-t border-gray-200 bg-[#f8f9fb] p-4 sm:p-6">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100"><img src={assets.location_icon} alt="" className="h-4.75 w-4.75" /></div>
                            <div><h3 className="text-sm font-semibold text-gray-900">Delivery Information</h3><p className="mt-0.5 text-xs text-gray-500">Customer and shipping details</p></div>
                          </div>
                          <p className="wrap-break-word text-sm font-semibold text-gray-800">{getCustomerName(order.address)}</p>
                          <p className="mt-1 wrap-break-word text-sm leading-6 text-gray-500">{getAddress(order.address)}</p>
                          {order.address?.phone && <p className="mt-2 wrap-break-word text-sm text-gray-500">Phone: {order.address.phone}</p>}
                          {order.address?.email && <p className="mt-1 break-all text-sm text-gray-500">Email: {order.address.email}</p>}
                          <div className="mt-4 border-t border-gray-100 pt-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Payment method</p><p className="mt-1.5 text-sm font-medium text-gray-800">{order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod || "—"}</p></div>
                        </section>

                        <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100"><img src={assets.order_summary_icon} alt="" className="h-4.75 w-4.75" /></div>
                            <div><h3 className="text-sm font-semibold text-gray-900">Order Summary</h3><p className="mt-0.5 text-xs text-gray-500">Payment breakdown</p></div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3"><p className="text-sm text-gray-500">Subtotal</p><p className="text-sm font-medium text-gray-800">{currency}{Number(order.subtotal || 0).toFixed(2)}</p></div>
                            <div className="flex items-center justify-between gap-3"><p className="text-sm text-gray-500">Delivery fee</p><p className="text-sm font-medium text-gray-800">{currency}{Number(order.deliveryFee || 0).toFixed(2)}</p></div>
                            <div className="flex items-center justify-between gap-3"><p className="text-sm text-gray-500">Total items</p><p className="text-sm font-medium text-gray-800">{totalItems}</p></div>
                            <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3"><p className="text-sm font-semibold text-gray-900">Total amount</p><p className="text-lg font-semibold text-gray-900">{currency}{Number(order.total || 0).toFixed(2)}</p></div>
                          </div>
                        </section>
                      </div>

                      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div><h3 className="text-sm font-semibold text-gray-900">Ordered Products</h3><p className="mt-1 text-xs text-gray-500">{totalItems} units across {(order.items || []).length} line items</p></div>
                          <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600">{order.items?.length || 0} products</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {(order.items || []).map((item, index) => {
                            const productImage = Array.isArray(item.image) ? item.image[0] : item.image;

                            return (
                              <div key={`${order._id}-${item.productId}-${item.size}-${index}`} className="flex min-w-0 items-center gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 sm:h-20 sm:w-20"><img src={productImage || "/placeholder.png"} alt={item.name || "Product"} className="h-full w-full object-cover" /></div>
                                <div className="min-w-0 flex-1">
                                  <p className="wrap-break-word text-sm font-semibold text-gray-800">{item.name || "Product"}</p>
                                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500"><span>Size: {item.size || "—"}</span><span>Qty: {item.quantity || 0}</span></div>
                                  <p className="mt-2 text-xs text-gray-500">{currency}{Number(item.price || 0).toFixed(2)} each</p>
                                </div>
                                <div className="shrink-0 text-right"><p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Total</p><p className="mt-1 text-sm font-semibold text-gray-900">{currency}{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p></div>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                        <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50"><img src={assets.delivery_truck} alt="" className="h-5 w-5 object-contain" /></div>
                            <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-gray-900">Delivery Schedule</h3><p className="mt-0.5 text-xs text-gray-500">Estimated arrival date</p></div>
                            <span className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold ${order.status === "Cancelled" ? "bg-red-50 text-red-600" : order.status === "Delivered" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{order.status === "Cancelled" ? "Cancelled" : order.status === "Delivered" ? "Completed" : "In progress"}</span>
                          </div>
                          <div className="p-4 sm:p-5">
                            {order.status === "Cancelled" ? (
                              <div className="rounded-xl border border-red-100 bg-red-50 p-4"><p className="text-sm font-semibold text-red-800">Delivery estimate unavailable</p><p className="mt-1 text-xs leading-5 text-red-700">This order has been cancelled, so its delivery date no longer applies.</p></div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">{order.status === "Delivered" ? "DATE DELIVERED" : "CURRENT ESTIMATE"}</p>
                                    <p className="mt-2 wrap-break-word text-xl font-semibold tracking-tight text-gray-900">{formatDate(order.status === "Delivered" ? order.deliveredAt || order.estimatedDeliveryDate : order.estimatedDeliveryDate)}</p>
                                    {order.status === "Delivered" && <p className="mt-1 text-xs text-emerald-700">Order marked as delivered.</p>}
                                  </div>
                                  {order.status !== "Delivered" && (
                                    <div className="relative shrink-0">
                                      <input id={`delivery-date-${order._id}`} type="date" value={getDateInputValue(order.estimatedDeliveryDate)} onChange={(e) => updateDeliveryDate(order._id, e.target.value)} disabled={updatingDeliveryDate === order._id} className="pointer-events-none absolute inset-0 h-10 w-10 opacity-0" aria-label="Choose delivery date" tabIndex={-1} />
                                      <button type="button" onClick={() => openDeliveryDatePicker(order._id)} disabled={updatingDeliveryDate === order._id} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Open delivery date calendar"><img src={assets.calendar_icon} alt="" className="h-5 w-5 object-contain" /></button>
                                    </div>
                                  )}
                                </div>
                                {updatingDeliveryDate === order._id && <p className="mt-3 text-xs text-gray-500">Saving delivery date...</p>}
                                {order.status === "Delivered" ? <p className="mt-3 text-xs text-gray-500">Delivery date cannot be changed after delivery.</p> : <p className="mt-3 text-xs leading-5 text-gray-500">Use the calendar icon to update the estimated delivery date.</p>}
                              </>
                            )}
                          </div>
                        </section>

                        <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100"><img src={assets.order_status_icon} alt="" className="h-5 w-5 object-contain" /></div>
                            <div><h3 className="text-sm font-semibold text-gray-900">Order Status</h3><p className="mt-0.5 text-xs text-gray-500">Manage order progress</p></div>
                          </div>
                          <div className="p-4 sm:p-5">
                            <label htmlFor={`status-${order._id}`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Current status</label>
                            <div className="relative">
                              <select id={`status-${order._id}`} value={order.status || "Order Placed"} onChange={(e) => updateStatus(order._id, e.target.value)} disabled={updatingOrder === order._id || order.status === "Cancelled" || order.status === "Delivered"} className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-60">
                                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                              </select>
                              <img src={assets.down_icon} alt="" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" />
                            </div>
                            {updatingOrder === order._id && <p className="mt-3 text-xs text-gray-500">Updating order status...</p>}
                            {order.status === "Cancelled" && <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-600">Cancelled orders cannot be reopened.</div>}
                            {order.status === "Delivered" && <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-700">This order has been completed. Its status can no longer be changed.</div>}
                            {!["Cancelled", "Delivered"].includes(order.status) && <p className="mt-3 text-xs leading-5 text-gray-500">Changes are saved to your order when you select a new status.</p>}
                          </div>
                        </section>
                      </div>

                      <div className="flex justify-end"><button type="button" onClick={() => toggleOrder(order._id)} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900">Collapse details<img src={assets.up_icon} alt="Collapse" className="h-3.75 w-3.75" /></button></div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {!loading && orders.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">Showing <span className="font-semibold text-gray-900">{filteredOrders.length}</span> of <span className="font-semibold text-gray-900">{orders.length}</span> orders</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Orders loaded</span>
            {(isSearchActive || statusFilter !== "All") && <button type="button" onClick={handleShowAllOrders} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-900">Clear filters</button>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;