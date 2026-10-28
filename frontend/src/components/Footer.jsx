import React from 'react';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const Footer = () => {
  return (
    <div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">

        <div>
          <img src={assets.logo} alt="logo" className="mb-5 w-32" />
          <p className="w-full md:w-2/3 text-gray-600">
            Explore premium essentials, timeless fashion, and everyday must-haves curated for modern living.
            Discover fresh arrivals, smart styling picks, and value-packed deals designed to upgrade your lifestyle.
            Shop confidently with quality you can trust and trends that keep you ahead.
          </p>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About us</Link>
            </li>
            <li>
              <Link to="/collection">Shop Collection</Link>
            </li>
            <li>
              <Link to="/contact">Contact us</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>+91-123-456-7890</li>
            <li>support@fluke.in</li>
          </ul>
        </div>

      </div>

      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright 2026@ fluke - All Right Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;