// src/components/admin/sidebar/SidebarHeader.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCookieBite, faTimes, faBars } from '@fortawesome/free-solid-svg-icons'; // faTimes برای بستن، faBars برای باز کردن

interface SidebarHeaderProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <div
      className={`
        p-4 border-b border-gray-200 dark:border-gray-700
        flex items-center shrink-0 h-[69px] // ارتفاع ثابت
        ${isOpen ? 'justify-between' : 'justify-center'}
      `}
    >
      {/* لوگو و نام برند - فقط وقتی سایدبار باز است */}
      {isOpen && (
        <div className="flex items-center overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faCookieBite} className="text-white text-lg" />
          </div>
          <span className="logo-text mr-3 text-lg font-bold text-gray-800 dark:text-white whitespace-nowrap">
            BAKEJÖY
          </span>
        </div>
      )}

      {/* دکمه Toggle - همیشه نمایش داده می‌شود و آیکون آن تغییر می‌کند */}
      <button
        onClick={toggleSidebar}
        className={`
          text-gray-600 hover:text-amber-600 dark:text-gray-300 dark:hover:text-amber-500
          focus:outline-none p-2 rounded-md
          ${!isOpen ? 'w-full h-full flex items-center justify-center' : ''}
        `}
        aria-label={isOpen ? "بستن سایدبار" : "باز کردن سایدبار"}
      >
        {/* اگر باز است آیکون بستن (مثلا X)، اگر بسته است آیکون همبرگری (faBars) */}
        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className="text-xl" />
      </button>
    </div>
  );
};

export default SidebarHeader;