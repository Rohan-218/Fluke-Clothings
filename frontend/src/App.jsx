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

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchBar from './components/SearchBar';

const App = () => {

  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />
      <SearchBar />

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
      </Routes>

      <Footer />
    </div>
  );
};

export default App;