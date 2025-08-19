// src/components/admin/header/NotificationBell.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { Link as RouterLink } from 'react-router-dom'; // اگر لینک "مشاهده همه" دارید

interface NotificationItem {
  id: string | number;
  title: string;
  message: string;
  timestamp?: string; // مثلا "۲ دقیقه پیش" یا تاریخ
  isRead?: boolean;
  link?: string; // لینک به بخش مربوطه در پنل
}

interface NotificationBellProps {
  notificationCount?: number; // تعداد اعلانات جدید (خوانده نشده)
  // می‌توانید یک تابع onOpen برای واکشی اعلانات هنگام باز شدن منو هم پاس دهید
  // onOpen?: () => void;
}

// داده نمونه برای اعلانات (این باید از API یا state سراسری بیاید)
const exampleNotifications: NotificationItem[] = [
  { id: 1, title: 'سفارش جدید', message: 'سفارش #1026 نیاز به بررسی دارد.', timestamp: '۵ دقیقه پیش', link: '/admin/orders/1026' },
  { id: 2, title: 'موجودی کم', message: 'موجودی کیک شکلاتی ویژه کمتر از ۵ عدد است.', timestamp: '۱ ساعت پیش', link: '/admin/products/edit/XYZ' },
  { id: 3, title: 'نظر جدید', message: 'یک نظر جدید برای محصول "کیک تولد" ثبت شده.', timestamp: 'دیروز', link: '/admin/reviews', isRead: true },
];

const NotificationBell: React.FC<NotificationBellProps> = ({ notificationCount: initialCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(exampleNotifications); // استفاده از داده نمونه
  const [unreadCount, setUnreadCount] = useState(initialCount > 0 ? initialCount : notifications.filter(n => !n.isRead).length);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    // if (!isOpen && onOpen) {
    //   onOpen(); // برای واکشی اعلانات هنگام باز شدن
    // }
    // اگر می‌خواهید با باز شدن منو، تعداد خوانده نشده صفر شود (باید منطق خوانده شدن هم پیاده‌سازی شود)
    // if (!isOpen) {
    //   setUnreadCount(0);
    // }
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

  // این useEffect برای آپدیت unreadCount بر اساس prop اولیه است
  useEffect(() => {
    setUnreadCount(initialCount > 0 ? initialCount : notifications.filter(n => !n.isRead).length);
  }, [initialCount, notifications]);


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-amber-400 focus:outline-none relative p-1.5 rounded-full hover:bg-amber-50 dark:hover:bg-gray-700/50 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="notifications-menu"
        aria-label={`Notifications (${unreadCount} new)`}
      >
        <FontAwesomeIcon icon={faBell} className="text-xl" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 
                       bg-red-500 text-white text-xs font-bold 
                       rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-800"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* منوی کشویی اعلانات */}
      {isOpen && (
        <div
          id="notifications-menu"
          className="absolute left-0 mt-2 w-72 sm:w-80 md:w-96 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 flex flex-col max-h-[calc(100vh-80px)]"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="notification-bell-button" // دکمه اصلی باید این id را داشته باشد
        >
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 shrink-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              اعلانات {unreadCount > 0 && `(${unreadCount} جدید)`}
            </p>
          </div>

          {notifications.length > 0 ? (
            <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-600">
              {notifications.map(notification => (
                <li key={notification.id}>
                  <RouterLink
                    to={notification.link || '#'}
                    onClick={() => setIsOpen(false)} // بستن منو پس از کلیک
                    className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors 
                                ${!notification.isRead ? 'bg-amber-50 dark:bg-amber-800/30' : ''}`}
                  >
                    <p className={`text-sm font-medium text-gray-800 dark:text-gray-100 ${!notification.isRead ? 'font-bold' : ''}`}>
                      {notification.title}
                    </p>
                    <p className={`text-xs text-gray-600 dark:text-gray-300 mt-0.5 ${!notification.isRead ? 'font-medium' : ''}`}>
                      {notification.message}
                    </p>
                    {notification.timestamp && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-left">
                        {notification.timestamp}
                      </p>
                    )}
                  </RouterLink>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">اعلان جدیدی برای نمایش وجود ندارد.</p>
            </div>
          )}

          {notifications.length > 0 && ( // نمایش "مشاهده همه" فقط اگر اعلانی وجود دارد
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600 text-center shrink-0">
              <RouterLink
                to="/admin/notifications" // مسیر صفحه همه اعلانات
                onClick={() => setIsOpen(false)}
                className="text-sm text-primary hover:text-primary-dark dark:text-amber-400 dark:hover:text-amber-300 font-medium"
              >
                مشاهده همه اعلانات
              </RouterLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;