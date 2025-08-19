// src/components/admin/header/AdminHeader.tsx

import React from 'react';
import AdminSearchBar from './AdminSearchBar';
import NotificationBell from './NotificationBell';
import DarkModeToggle from './DarkModeToggle';
import UserMenuDropdown from './UserMenuDropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// این کامپوننت دیگر نیازی به پراپ برای کنترل سایدبار ندارد
interface AdminHeaderProps {}

const AdminHeader: React.FC<AdminHeaderProps> = () => {
  return (
    <header 
      className="
        bg-white shadow-sm
        dark:bg-slate-800 dark:border-b dark:border-slate-700
        py-3 px-4 sm:px-6 
        flex items-center justify-between 
        sticky top-0 z-10
      "
    >
      {/* بخش چپ هدر: فقط جستجو باقی می‌ماند */}
      <div className="flex items-center">
        <AdminSearchBar />
      </div>

      {/* بخش راست هدر: آیکون‌ها و منوی کاربر */}
      <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
        <DarkModeToggle />
        <NotificationBell notificationCount={3} />
        <UserMenuDropdown
          userName="مدیر سیستم" userEmail="admin@bakejoy.com"
        />
      </div>
    </header>
  );
};

export default AdminHeader;
