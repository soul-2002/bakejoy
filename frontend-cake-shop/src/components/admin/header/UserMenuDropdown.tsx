// src/components/admin/header/UserMenuDropdown.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faCog, faSignOutAlt, faChevronDown, faUserCog } from '@fortawesome/free-solid-svg-icons'; // faUserCircle به جای faUser
import { useAuth } from '../../../contexts/AuthContext'; // مسیر AuthContext شما

interface UserMenuDropdownProps {
  // این props ها می‌توانند از AuthContext خوانده شوند، پس شاید لازم نباشند
  // userName?: string;
  // userEmail?: string;
  // avatarIcon?: any; // IconProp یا string برای مسیر تصویر
}

const UserMenuDropdown: React.FC<UserMenuDropdownProps> = (/*{ userName, userEmail, avatarIcon }*/) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth(); // اطلاعات کاربر و تابع خروج از AuthContext
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null); // برای تشخیص کلیک بیرون از منو

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleLogoutClick = async () => {
    setIsOpen(false); // بستن منو قبل از خروج
    if (logout) {
      try {
        await logout(); // تابع logout شما ممکن است async باشد
        navigate('/admin/login'); // یا هر مسیر دیگری که برای صفحه ورود ادمین دارید
      } catch (error) {
        console.error("Error during logout:", error);
        // می‌توانید یک پیام خطا به کاربر نمایش دهید
      }
    } else {
      console.warn("Logout function not available in AuthContext.");
      navigate('/admin/login'); // fallback
    }
  };

  // بستن منو با کلیک بیرون از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // اگر کاربر لاگین نکرده یا اطلاعاتش موجود نیست، چیزی نمایش نده یا یک حالت دیگر نشان بده
  // این بستگی به منطق AuthContext شما دارد.
  if (!user) { // اگر کاربر ادمین از AuthContext قابل دسترس نیست
    return null; // یا یک لینک به صفحه لاگین ادمین
  }

  const displayName = user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}` 
                      : user.username || 'کاربر ادمین';
  const displayEmail = user.email || '';
  // آواتار را می‌توانید از اطلاعات کاربر بگیرید یا یک آیکون پیش‌فرض نمایش دهید
  const avatarDisplay = (
    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300">
      <FontAwesomeIcon icon={faUserCircle} size="lg" /> {/* آیکون پیش‌فرض */}
    </div>
  );


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="user-menu-button"
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-amber-400 focus:outline-none p-1 rounded-md hover:bg-amber-50 dark:hover:bg-gray-700/50"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="user-dropdown-menu"
      >
        {avatarDisplay}
        <span className="mx-2 text-sm font-medium hidden sm:inline">{displayName}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {/* منوی کشویی */}
      {isOpen && (
        <div
          id="user-dropdown-menu"
          className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg 
                     py-1 z-50 border border-gray-200 dark:border-gray-600"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          {/* نمایش نام و ایمیل در بالای منو (اختیاری) */}
          {(displayName || displayEmail) && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              {displayName && <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{displayName}</p>}
              {displayEmail && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{displayEmail}</p>}
            </div>
          )}

          <RouterLink
            to="/admin/profile" // مسیر پروفایل ادمین (باید ایجاد شود)
            className="w-full text-right block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
            role="menuitem"
            onClick={() => setIsOpen(false)} // بستن منو پس از کلیک
          >
            <FontAwesomeIcon icon={faUserCog} className="ml-2.5 w-4 h-4 inline-block" />
            پروفایل کاربری
          </RouterLink>
          <RouterLink
            to="/admin/settings/store" // مسیر تنظیمات فروشگاه ادمین
            className="w-full text-right block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <FontAwesomeIcon icon={faCog} className="ml-2.5 w-4 h-4 inline-block" />
            تنظیمات
          </RouterLink>
          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div> {/* جداکننده */}
          <button
            onClick={handleLogoutClick}
            className="w-full text-right block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-700/30 hover:text-red-600 dark:hover:text-red-300"
            role="menuitem"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="ml-2.5 w-4 h-4 inline-block" />
            خروج
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenuDropdown;