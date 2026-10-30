import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

import Home from './pages/Home';
import Collection from './pages/Collection';
import PlaceOrder from './pages/PlaceOrder';
import Orders from './pages/Orders';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PaymentReturn from "./pages/PaymentReturn";

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchBar from './components/SearchBar';

const App = () => {

  const { pathname } = useLocation();

  const isPaymentReturnPage = pathname === "/payment-return";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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

  return (
    <div className={isPaymentReturnPage ? "min-h-screen" : "px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]"}>
      <ToastContainer position="top-right" autoClose={3000} />

      {!isPaymentReturnPage && (
        <>
          <Navbar />
          {pathname === "/" && (
            <div className="h-[68px] sm:hidden"></div>
          )}
          <SearchBar />
        </>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/payment-return" element={<PaymentReturn />} />
      </Routes>

      {!isPaymentReturnPage && <Footer />}
    </div>
  );
};

export default App;