import React from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';

const Sidebar = () => {
  const navItems = [
    { name: 'Add Items', path: '/add', icon: assets.add_icon },
    { name: 'List Items', path: '/list', icon: assets.list_icon },
    { name: 'Orders', path: '/orders', icon: assets.order_icon },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden min-h-[calc(100vh-65px)] w-60 shrink-0 border-r border-gray-200 bg-white md:block lg:w-65">
        <div className="sticky top-0 flex flex-col px-4 py-7 lg:px-5">
          <div className="mb-7 px-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Workspace</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-900">Manage Store</h2>
            <p className="mt-1 text-xs text-gray-500">Your store at a glance</p>
          </div>

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Menu</p>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path}>
                {({ isActive }) => (
                  <div className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm transition-all duration-200 ${isActive ? 'bg-gray-900 font-semibold text-white shadow-sm' : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-white/10' : 'bg-gray-100 group-hover:bg-white'}`}>
                      <img src={item.icon} alt="" className={`h-5 w-5 object-contain ${isActive ? 'brightness-0 invert' : ''}`} />
                    </span>
                    <span className="flex-1">{item.name}</span>
                    <span className={`text-lg leading-none transition-transform duration-200 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'}`}>›</span>
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-800">Store management</p>
            <p className="mt-1.5 text-xs leading-5 text-gray-500">Manage products and keep track of customer orders.</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-gray-200 bg-white px-2 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs transition ${isActive ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-500'}`}>
            <img src={item.icon} alt="" className="h-5 w-5 object-contain" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
