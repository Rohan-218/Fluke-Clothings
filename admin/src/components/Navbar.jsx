import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';

const Navbar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const onLogoutHandler = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/logout`,
        {},
        { withCredentials: true }
      );

      if (response.data.success === true) {
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
        toast.success(response.data.message || "Logout successful");
      } else {
        toast.error(response.data.message || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error.response?.data?.message || "Unable to log out.");
    }
  };

  return (
    <>
      {/* Fixed Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">

        {/* Logo and Dashboard Title */}
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={assets.logo}
            alt="Fluke logo"
            className="w-25 shrink-0 object-contain sm:w-30"
          />

          <span className="hidden h-7 w-px bg-gray-200 sm:block"></span>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-tight text-gray-900">
              Admin Dashboard
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Manage your store
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogoutHandler}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-gray-100 sm:px-5 sm:py-2.5 sm:text-sm"
        >
          <img
            src={assets.logout_icon}
            alt=""
            className="h-4 w-4 object-contain"
          />
          Logout
        </button>

      </header>

      {/* Spacer to prevent content from going underneath navbar */}
      <div className="h-16"></div>
    </>
  );
};

export default Navbar;