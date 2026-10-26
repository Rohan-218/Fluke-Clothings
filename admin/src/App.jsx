import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import axios from "axios";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Login from "./components/Login";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = "₹";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${backendUrl}/api/auth/me`);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      {!isAuthenticated ? (
        <Login setIsAuthenticated={setIsAuthenticated} />
      ) : (
        <>
          <Navbar setIsAuthenticated={setIsAuthenticated} />
          <hr />

          <div className="flex w-full">
            <Sidebar />

            <div className="w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base">
              <Routes>
                <Route path="/" element={<Navigate to="/add" replace />} />
                <Route path="/add" element={<Add />} />
                <Route path="/list" element={<List />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="*" element={<Navigate to="/add" replace />} />
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
