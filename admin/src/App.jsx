import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import Login from "./components/Login";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = "₹";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${backendUrl}/api/auth/me`, {
          withCredentials: true,
        });

        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (import.meta.env.PROD && !sessionStorage.getItem("server-wakeup")) {
      toast.info(
        "Our server may take up to 50 seconds to respond after inactivity. This happens because our free hosting service (Render) temporarily puts the server to sleep when it isn't being used. Please wait while it wakes up. Thank you for your patience!",
        {
          autoClose: 7000,
          position: "top-center",
          toastId: "server-wakeup",
        }
      );

      sessionStorage.setItem("server-wakeup", "shown");
    }
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-center text-sm text-gray-600 sm:text-base">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-center" autoClose={3000} />

      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/add" replace />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="*"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : (
              <>
                {/* Fixed Navbar */}
                <Navbar setIsAuthenticated={setIsAuthenticated} />

                {/* Dashboard Layout */}
                <div className="flex min-h-screen">

                  {/* Fixed Sidebar */}
                  <Sidebar />

                  {/* Main Content */}
                  <main className="min-w-0 w-full flex-1 px-3 pt-20 pb-24 text-base text-gray-600 sm:px-5 md:ml-60 md:px-5 md:pt-6 md:pb-8 lg:ml-65 lg:px-8">
                    <div className="mx-auto w-full max-w-[1600px]">
                      <Routes>
                        <Route path="/" element={<Navigate to="/add" replace />} />
                        <Route path="/add" element={<Add />} />
                        <Route path="/list" element={<List />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="*" element={<Navigate to="/add" replace />} />
                      </Routes>
                    </div>
                  </main>
                </div>
              </>
            )
          }
        />
      </Routes>
    </div>
  );
};

export default App;