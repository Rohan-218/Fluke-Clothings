import React, { useState, useContext } from "react";
import axios from "axios";
import { assets } from "../assets/assets";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  const {
    backendUrl,
    showSearch,
    setShowSearch,
    getCartCount,
    isAuthenticated,
    setIsAuthenticated,
    setCartItems,
    authLoading,
  } = useContext(ShopContext);

  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setProfileVisible(false);
      navigate("/login");
      return;
    }

    setProfileVisible((previous) => !previous);
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/auth/logout`,
        {},
        { withCredentials: true }
      );

      // Immediately clear the frontend authentication and cart state
      setIsAuthenticated(false);
      setCartItems({});
      setProfileVisible(false);
      setVisible(false);

      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-between py-5 font-medium">
      <Link to="/">
        <img src={assets.logo} className="w-36" alt="Logo" />
      </Link>

      <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
        <NavLink to="/" className="flex flex-col items-center gap-1">
          <p>HOME</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>

        <NavLink to="/collection" className="flex flex-col items-center gap-1">
          <p>COLLECTION</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>

        <NavLink to="/about" className="flex flex-col items-center gap-1">
          <p>ABOUT</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>

        <NavLink to="/contact" className="flex flex-col items-center gap-1">
          <p>CONTACT</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
      </ul>

      <div className="flex items-center gap-5">
        <img
          onClick={() => setShowSearch(!showSearch)}
          src={assets.search_icon}
          className="w-5 cursor-pointer"
          alt="Search"
        />

        <div className="group relative">
          <img
            onClick={handleProfileClick}
            src={assets.profile_icon}
            className="w-5 cursor-pointer"
            alt="Profile"
          />

          {isAuthenticated && (
            <div
              className={`absolute dropdown-menu right-0 pt-4 z-50 ${
                profileVisible ? "block" : "hidden"
              } sm:group-hover:block sm:hidden`}
            >
              <div className="flex flex-col gap-3 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded shadow-md">
                <p
                  onClick={() => {
                    setProfileVisible(false);
                    navigate("/profile");
                  }}
                  className="cursor-pointer hover:text-black"
                >
                  My Profile
                </p>

                <p
                  onClick={() => {
                    setProfileVisible(false);
                    navigate("/orders");
                  }}
                  className="cursor-pointer hover:text-black"
                >
                  Orders
                </p>

                <p
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 hover:text-red-800"
                >
                  Logout
                </p>
              </div>
            </div>
          )}
        </div>

        <Link to="/cart" className="relative">
          <img
            src={assets.cart_icon}
            className="w-5 min-w-5"
            alt="Cart"
          />
          <p className="absolute -right-1.25 -bottom-1.25 w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
            {getCartCount()}
          </p>
        </Link>

        <img
          onClick={() => setVisible(true)}
          src={assets.menu_icon}
          className="w-5 cursor-pointer sm:hidden"
          alt="Menu"
        />
      </div>

      <div
        className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${
          visible ? "w-full" : "w-0"
        }`}
      >
        <div className="flex flex-col text-gray-600">
          <div
            onClick={() => setVisible(false)}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <img
              className="h-3 rotate-180"
              src={assets.dropdown_icon}
              alt="Dropdown"
            />
            <p>Back</p>
          </div>

          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 cursor-pointer border hover:bg-gray-200"
            to="/"
          >
            HOME
          </NavLink>

          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 cursor-pointer border hover:bg-gray-200"
            to="/collection"
          >
            COLLECTION
          </NavLink>

          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 cursor-pointer border hover:bg-gray-200"
            to="/about"
          >
            ABOUT
          </NavLink>

          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 cursor-pointer border hover:bg-gray-200"
            to="/contact"
          >
            CONTACT
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Navbar;