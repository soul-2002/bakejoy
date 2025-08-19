// src/components/admin/sidebar/SidebarFooter.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext'; // یا هر روشی که به اطلاعات کاربر و تابع خروج دسترسی دارید

interface SidebarFooterProps {
  isOpen: boolean;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ isOpen }) => {
  const { user, logout } = useAuth(); // مثال: استفاده از AuthContext

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
  };

  return (
    <div className={`mt-auto border-t border-gray-200 dark:border-gray-700 shrink-0 
                    ${isOpen ? 'p-4' : 'p-3 flex justify-center items-center'}`} // پدینگ کمتر و مرکز چین در حالت بسته
    >
      {isOpen ? (
        // حالت باز: نمایش کامل اطلاعات کاربر و دکمه خروج
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faUser} className="text-gray-600 dark:text-gray-300" />
          </div>
          <div className="mr-3 overflow-hidden">
            <div className="text-sm font-medium text-gray-800 dark:text-white whitespace-nowrap truncate">
              {user?.first_name || user?.username || 'کاربر'}
            </div>
            {user?.email && (
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap truncate">
                {user.email}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 ml-auto p-2 rounded-md"
            title="خروج"
            aria-label="خروج"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
          </button>
        </div>
      ) : (
        // حالت بسته: نمایش فقط آیکون کاربر (می‌تواند لینک به پروفایل یا دکمه خروج باشد)
        <button
          onClick={handleLogout} // یا لینک به پروفایل کاربر
          className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 p-2 rounded-md"
          title={user?.username || "کاربر"} // Tooltip با نام کاربری
          aria-label="اطلاعات کاربری یا خروج"
        >
          <FontAwesomeIcon icon={faUser} className="text-xl" />
        </button>
      )}
    </div>
  );
};

export default SidebarFooter;