
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
        `${backendUrl}/api/auth/logout`
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
      toast.error(
        error.response?.data?.message || "Unable to log out."
      );
    }
  };

  return (
    <div className="flex items-center py-2 px-[4%] justify-between">
      <img
        className="w-[max(10%,80px)]"
        src={assets.logo}
        alt="nav-logo"
      />

      <button
        onClick={onLogoutHandler}
        className="bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;
