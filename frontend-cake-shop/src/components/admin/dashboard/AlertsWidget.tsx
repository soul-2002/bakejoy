// src/components/admin/dashboard/AlertsWidget.tsx
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamation,
  faExclamationTriangle,
  faCommentDots,
} from '@fortawesome/free-solid-svg-icons';
// import { getDashboardAlerts } from '../../../services/api'; // تابع API برای گرفتن هشدارها
// import { DashboardAlert } from '../../../types'; // تایپ هشدارها
// import { useAuth } from '../../../contexts/AuthContext';

interface AlertItemProps {
  id: string | number;
  message: string;
  timestamp?: string; // مثلا "۲ ساعت پیش" یا تاریخ دقیق
  link: string;
  icon: any; // IconProp
  iconBgClass: string;
  iconColorClass: string;
}

// داده نمونه، این باید از API بیاید
const exampleAlerts: AlertItemProps[] = [
  {
    id: 1,
    message: '۵ سفارش جدید نیاز به بررسی دارند',
    timestamp: '۲ ساعت پیش',
    link: '/admin/orders?status=pending',
    icon: faExclamation,
    iconBgClass: 'bg-red-100 dark:bg-red-800',
    iconColorClass: 'text-red-500 dark:text-red-300',
  },
  {
    id: 2,
    message: '۳ محصول موجودی کمتر از ۵ عدد دارند',
    timestamp: 'امروز ۱۰:۳۰',
    link: '/admin/products?stock=low',
    icon: faExclamationTriangle,
    iconBgClass: 'bg-yellow-100 dark:bg-yellow-800',
    iconColorClass: 'text-yellow-500 dark:text-yellow-300',
  },
  {
    id: 3,
    message: '۲ نظر جدید برای تایید',
    timestamp: 'دیروز ۱۸:۴۵',
    link: '/admin/reviews?status=pending', // فرض بر وجود صفحه مدیریت نظرات
    icon: faCommentDots,
    iconBgClass: 'bg-blue-100 dark:bg-blue-800',
    iconColorClass: 'text-blue-500 dark:text-blue-300',
  },
];

const AlertsWidget: React.FC = () => {
  // const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const { accessToken } = useAuth();

  // useEffect(() => {
  //   const fetchAlerts = async () => {
  //     if (!accessToken) return;
  //     setLoading(true);
  //     try {
  //       // const data = await getDashboardAlerts(accessToken);
  //       // setAlerts(data);
  //       setAlerts(exampleAlerts); // استفاده از داده نمونه
  //     } catch (err) {
  //       // setError("Failed to load alerts");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchAlerts();
  // }, [accessToken]);

  // فعلا از داده نمونه استفاده می‌کنیم
  const alertsToDisplay = exampleAlerts;
  const loading = false; // برای داده نمونه، لودینگ را false می‌گذاریم
  const error = null;


  return (
    <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6 ">
      <h3 className="text-lg font-semibold text-text-dark dark:text-white mb-4">نیازمند توجه</h3>
      {loading && <p className="text-gray-500 dark:text-gray-400">در حال بارگذاری هشدارها...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && alertsToDisplay.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">مورد جدیدی برای توجه وجود ندارد.</p>
      )}
      {!loading && !error && alertsToDisplay.length > 0 && (
        <div className="space-y-4">
          {alertsToDisplay.map((alert) => (
            <div key={alert.id} className="flex items-start">
              <div className={`w-8 h-8 rounded-full ${alert.iconBgClass} flex items-center justify-center mt-1 flex-shrink-0`}>
                <FontAwesomeIcon icon={alert.icon} className={`${alert.iconColorClass}`} />
              </div>
              <div className="mr-3 flex-grow min-w-0">
                <p className="text-sm font-medium text-text-dark dark:text-gray-200 truncate_">{alert.message}</p> {/* truncate برای جلوگیری از سرریز */}
                {alert.timestamp && (
                  <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">{alert.timestamp}</p>
                )}
              </div>
              <RouterLink
                to={alert.link}
                className="text-xs text-primary hover:text-primary-dark dark:text-amber-400 dark:hover:text-amber-300 font-medium flex-shrink-0 ml-2"
              >
                مشاهده
              </RouterLink>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsWidget;