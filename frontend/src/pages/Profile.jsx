import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

const Profile = () => {
  const { backendUrl, isAuthenticated, authLoading, setIsAuthenticated, currency } = useContext(ShopContext);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${backendUrl}/api/user/profile`, {
          withCredentials: true,
        });

        if (response.data.success === true) {
          setUser(response.data.user);
        } else {
          toast.error(response.data.message || "Failed to load profile");
        }
      } catch (error) {
        console.error(
          "Fetch profile error:",
          error.response?.data || error.message
        );

        toast.error(
          error.response?.data?.message || "Unable to load your profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [backendUrl, isAuthenticated, authLoading, navigate]);

  const logout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      const response = await axios.post(
        `${backendUrl}/api/auth/logout`,
        {},
        { withCredentials: true }
      );

      if (response.data.success === false || response.data.status === "error") {
        toast.error(response.data.message || "Failed to log out");
        return;
      }

      setIsAuthenticated(false);
      setUser(null);

      toast.success(response.data.message || "Logged out successfully");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(
        "Logout error:",
        error.response?.data || error.message
      );

      toast.error(error.response?.data?.message || "Unable to log out");
    } finally {
      setLoggingOut(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    if (status === "Delivered") return "bg-green-100 text-green-700";
    if (status === "Cancelled") return "bg-red-100 text-red-700";
    if (status === "Shipped" || status === "Out for Delivery") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  if (authLoading || loading) {
    return (
      <div className="border-t py-20 text-center text-gray-500">
        Loading your profile...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const name = user.name || user.fullName || "Customer";
  const email = user.email || "—";
  const recentOrders = user.recentOrders || [];

  return (
    <div className="border-t pt-10 sm:pt-16">
      <div className="mb-8 text-2xl">
        <Title text1={"MY"} text2={"PROFILE"} />
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="rounded-md border border-gray-200 p-5 sm:p-8">
          <div className="flex flex-col items-center gap-4 border-b pb-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-100 text-3xl font-medium uppercase text-gray-700">
              {name.charAt(0)}
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-gray-800">
                {name}
              </h2>

              <p className="mt-1 break-all text-sm text-gray-500">
                {email}
              </p>

            </div>
          </div>

          <div className="py-6">
            <h3 className="mb-4 text-lg font-medium text-gray-800">
              Account Information
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-1 border-b pb-3 sm:flex-row sm:justify-between sm:gap-4">
                <p className="text-gray-500">Full Name</p>
                <p className="wrap-break-word font-medium text-gray-800 sm:text-right">
                  {name}
                </p>
              </div>

              <div className="flex flex-col gap-1 border-b pb-3 sm:flex-row sm:justify-between sm:gap-4">
                <p className="text-gray-500">Email Address</p>
                <p className="break-all font-medium text-gray-800 sm:text-right">
                  {email}
                </p>
              </div>

              <div className="flex flex-col gap-1 border-b pb-3 sm:flex-row sm:justify-between sm:gap-4">
                <p className="text-gray-500">Customer ID</p>
                <p className="break-all font-medium text-gray-800 sm:text-right">
                  {user._id || "—"}
                </p>
              </div>

              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <p className="text-gray-500">Member Since</p>
                <p className="font-medium text-gray-800 sm:text-right">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t py-6 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="mt-2 text-2xl font-semibold text-gray-800">
                {user.totalOrders ?? 0}
              </p>
            </div>

            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Cancelled Orders</p>
              <p className="mt-2 text-2xl font-semibold text-red-600">
                {user.cancelledOrders ?? 0}
              </p>
            </div>
          </div>

          <div className="border-t py-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-medium text-gray-800">
                Recent Orders
              </h3>

              <Link
                to="/orders"
                className="text-sm text-gray-600 underline underline-offset-4 hover:text-black"
              >
                View All
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="rounded-md bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                You haven't placed any orders yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex flex-col gap-3 rounded-md border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="break-all text-sm font-medium text-gray-800">
                        Order #{order._id}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Placed on {formatDate(order.createdAt)}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {order.items?.length || 0} item(s)
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {currency}{Number(order.total || 0).toFixed(2)}
                        </p>

                        <span
                          className={`mt-2 inline-block rounded px-2 py-1 text-xs font-medium ${getStatusStyle(order.status)}`}
                        >
                          {order.status || "Order Placed"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
            <Link
              to="/orders"
              className="w-full border border-black bg-black px-5 py-3 text-center text-sm text-white transition hover:bg-gray-800 sm:flex-1"
            >
              My Orders
            </Link>

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="w-full border border-red-500 px-5 py-3 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;