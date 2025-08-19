// src/layouts/UserProfileLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import UserProfileSidebar from '../profile/UserProfileSidebar';
import MobileBottomNav from '../profile/MobileBottomNav';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

const UserProfileLayout: React.FC = () => {
  // این state برای باز و بسته کردن منوی موبایل (که کل صفحه را می‌گیرد) استفاده می‌شود.
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Menu (Overlay) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white dark:bg-slate-800 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
            <h1 className="title-font text-xl font-bold text-amber-600">BAKEJÖY</h1>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-600 dark:text-gray-300">
              <FontAwesomeIcon icon={faTimes} className="text-2xl" />
            </button>
          </div>
          {/* محتوای سایدبار برای منوی موبایل */}
          <UserProfileSidebar onLinkClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col flex-shrink-0 bg-white dark:bg-slate-800 shadow-md">
        <UserProfileSidebar />
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pb-16 md:pb-0"> {/* pb-16 برای ایجاد فضا برای منوی پایین موبایل */}
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <button onClick={() => setMobileMenuOpen(true)} className="text-gray-600 dark:text-gray-300">
            <FontAwesomeIcon icon={faBars} className="text-xl" />
          </button>
          <h1 className="title-font text-xl font-bold text-amber-600">پنل کاربری</h1>
          <div className="w-8"></div> {/* برای تراز کردن عنوان در مرکز */}
        </header>

        {/* محتوای اصلی صفحات (پیشخوان، سفارشات و ...) اینجا رندر می‌شود */}
        <main className="flex-grow overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default UserProfileLayout;