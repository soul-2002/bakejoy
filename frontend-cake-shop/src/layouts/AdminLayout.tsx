// src/layouts/AdminLayout.tsx

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/admin/sidebar/Sidebar';
import AdminHeader from '../components/admin/header/AdminHeader';

const AdminLayout: React.FC = () => {
  // --- تغییر کلیدی اینجاست ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // این کد فقط در سمت کلاینت اجرا می‌شود
    if (typeof window !== 'undefined') {
      // ۱. ابتدا سعی کن از مقدار ذخیره شده در حافظه مرورگر استفاده کنی
      const storedState = localStorage.getItem('sidebarOpen');
      if (storedState !== null) {
        return JSON.parse(storedState);
      }
      // ۲. اگر مقداری ذخیره نشده بود، بر اساس اندازه صفحه تصمیم بگیر
      // نقطه شکست lg در Tailwind معمولا 1024px است
      return window.innerWidth >= 1024; // در دسکتاپ true (باز) و در موبایل/تبلت false (بسته) خواهد بود
    }
    // مقدار پیش‌فرض در سمت سرور (برای SSR)
    return true;
  });

  // ذخیره وضعیت سایدبار در localStorage هنگام تغییر
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  // فقط یک تابع برای باز و بسته کردن سایدبار
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden rtl">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
      />

      <div 
        className={`
          flex-1 flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
          // حاشیه همیشه بر اساس وضعیت سایدبار و عرض آن اعمال می‌شود
          ${isSidebarOpen ? 'mr-64' : 'mr-20'}
        `}
      >
        <AdminHeader />
        
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gray-50 dark:bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
