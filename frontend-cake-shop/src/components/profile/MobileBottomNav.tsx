// src/components/profile/MobileBottomNav.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUserEdit, faShoppingBag, faHeart } from '@fortawesome/free-solid-svg-icons';

const MobileBottomNav: React.FC = () => {
  const baseClass = "flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 flex-1 py-2 transition-transform duration-200";
  const activeClass = "text-amber-600 dark:text-amber-400 transform -translate-y-1";
  
  const navItems = [
    { to: "/profile", icon: faHome, label: "پیشخوان", exact: true },
    { to: "/profile/edit-info", icon: faUserEdit, label: "پروفایل" },
    { to: "/profile/orders", icon: faShoppingBag, label: "سفارشات" },
    { to: "/profile/wishlist", icon: faHeart, label: "علاقه‌ها" },
  ];

  return (
    <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 flex justify-around items-center shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)] z-10">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}
        >
          <FontAwesomeIcon icon={item.icon} className="mb-1 text-xl" />
          <span className="text-xs">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileBottomNav;