import React from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';

const Sidebar = () => {
  return (
    <>
      <div className="hidden md:block w-[18%] min-h-screen border-r-2">
        <div className="flex flex-col gap-4 pt-6 pl-[20%] text-[15px]">
          <NavLink className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l" to="/add">
            <img className="w-5 h-5" src={assets.add_icon} alt="add-icon" />
            <p>Add Items</p>
          </NavLink>

          <NavLink className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l" to="/list">
            <img className="w-5 h-5" src={assets.list_icon} alt="list-items" />
            <p>List Items</p>
          </NavLink>

          <NavLink className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l" to="/orders">
            <img className="w-5 h-5" src={assets.order_icon} alt="order-icon" />
            <p>Orders</p>
          </NavLink>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-gray-200 bg-white px-2 py-2 shadow-md md:hidden">
        <NavLink to="/add" className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs ${isActive ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-500'}`}>
          <img src={assets.add_icon} alt="" className="h-5 w-5" />
          <span>Add Items</span>
        </NavLink>
        <NavLink to="/list" className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs ${isActive ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-500'}`}>
          <img src={assets.list_icon} alt="" className="h-5 w-5" />
          <span>List Items</span>
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs ${isActive ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-500'}`}>
          <img src={assets.order_icon} alt="" className="h-5 w-5" />
          <span>Orders</span>
        </NavLink>
      </nav>
    </>
  );
};

export default Sidebar;