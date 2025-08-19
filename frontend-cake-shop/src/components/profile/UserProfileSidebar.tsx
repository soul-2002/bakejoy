import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faUserEdit, faShoppingBag, faMapMarkerAlt, faHeart, faSignOutAlt, faUser
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext'; // مسیر صحیح به AuthContext

interface UserProfileSidebarProps {
  onLinkClick?: () => void; // برای بستن منوی موبایل پس از کلیک
}

const UserProfileSidebar: React.FC<UserProfileSidebarProps> = ({ onLinkClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if(logout) {
      logout();
    }
    if (onLinkClick) onLinkClick();
    navigate('/'); // هدایت به صفحه اصلی پس از خروج
  };
  
  // این تابع حالا کلاس پایه sidebar-item را برمی‌گرداند.
  // کلاس .active به صورت خودکار توسط NavLink (بر اساس استایل‌های CSS شما) اعمال می‌شود.
  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `sidebar-item flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg text-gray-700 dark:text-gray-300 transition-colors duration-200 ${
      isActive ? 'active' : 'hover:bg-amber-50/50 dark:hover:bg-slate-700'
    }`;

  const navItems = [
    { to: "/profile", icon: faHome, label: "پیشخوان", exact: true },
    { to: "/profile/edit-info", icon: faUserEdit, label: "اطلاعات حساب" },
    { to: "/profile/orders", icon: faShoppingBag, label: "سفارشات من" },
    { to: "/profile/addresses", icon: faMapMarkerAlt, label: "آدرس‌ها" },
    { to: "/profile/wishlist", icon: faHeart, label: "علاقه‌مندی‌ها" },
  ];

  return (
    <React.Fragment>
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 hidden md:block">
        <p className="text-sm text-gray-500 dark:text-gray-400">پنل کاربری</p>
      </div>
      
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-amber-50 dark:bg-slate-700/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">سلام، {user?.first_name || user?.username || 'کاربر'}!</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">به پنل کاربری خوش آمدید</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={navLinkClasses}
              onClick={onLinkClick}
            >
              <FontAwesomeIcon icon={item.icon} className="w-5 text-center" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="sidebar-item w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-amber-50/50 dark:hover:bg-slate-700"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-5 text-center text-gray-500" />
            <span>خروج</span>
          </button>
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-slate-700 hidden md:block">
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          <p>نسخه ۱.۰.۰</p>
        </div>
      </div>
    </React.Fragment>
  );
};

export default UserProfileSidebar;