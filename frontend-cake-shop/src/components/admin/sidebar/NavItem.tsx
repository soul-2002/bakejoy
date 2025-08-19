// src/components/admin/sidebar/NavItem.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface NavItemProps {
  label: string;
  href: string;
  icon?: IconDefinition;
  exact?: boolean;
  badgeText?: string;
  badgeColorClasses?: string;
  isSidebarOpen: boolean; // این پراپ از SidebarNav می‌آید
}

const NavItem: React.FC<NavItemProps> = ({ 
  label, 
  href, 
  icon, 
  exact = false, 
  badgeText, 
  badgeColorClasses, 
  isSidebarOpen 
}) => {
  return (
    <NavLink
      to={href}
      end={exact}
      className={({ isActive }) =>
        `nav-item group flex items-center p-3 text-sm rounded-lg transition-colors duration-150
         ${isSidebarOpen ? 'font-medium' : 'justify-center'} // در حالت بسته آیکون را مرکز می‌کند
         ${isActive
           ? 'bg-amber-500 text-white dark:bg-amber-600'
           : `text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
              ${!isSidebarOpen ? 'hover:bg-gray-200 dark:hover:bg-gray-600' : ''}`
         }`
      }
      title={!isSidebarOpen ? label : undefined} // Tooltip برای نام آیتم وقتی فقط آیکون است
    >
      {icon && (
        <FontAwesomeIcon
          icon={icon}
          className={`
            flex-shrink-0
            transition-all duration-300
            ${isSidebarOpen ? 'w-5 h-5 ml-3' : 'w-6 h-6 text-xl'} // آیکون بزرگتر در حالت بسته
          `}
        />
      )}

      {/* لیبل و بج فقط زمانی نمایش داده می‌شوند که isSidebarOpen true باشد */}
      {isSidebarOpen && (
        <>
          <span className="nav-text whitespace-nowrap overflow-hidden flex-grow opacity-100 transition-opacity duration-200">
            {label}
          </span>
          {badgeText && (
            <span
              className={`nav-text mr-auto ml-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColorClasses} transition-opacity duration-200`}
            >
              {badgeText}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

export default NavItem;