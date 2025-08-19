// src/components/admin/dashboard/RecentOrdersWidget.tsx
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext'; // مسیر AuthContext شما
import { getAdminOrders } from '../../../services/api';   // تابع API شما
import { Order, PaginatedResponse } from '../../../types'; // تایپ Order و PaginatedResponse

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { CircularProgress, Typography, Alert } from '@mui/material'; // برای لودینگ و خطا

interface RecentOrdersWidgetProps {
  count?: number;
  title?: string;
}

const RecentOrdersWidget: React.FC<RecentOrdersWidgetProps> = ({
  count = 5, // نمایش ۵ سفارش آخر به طور پیش‌فرض
  title = "سفارشات اخیر"
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!accessToken) {
        setError("توکن دسترسی ادمین موجود نیست.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // ارسال پارامترها به تابع API
        const response = await getAdminOrders(accessToken, {
          limit: count,
          ordering: '-created_at' // جدیدترین‌ها اول
        });

        // بررسی اینکه آیا پاسخ PaginatedResponse است یا آرایه مستقیم
        if (response && Array.isArray((response as PaginatedResponse<Order>).results)) {
          setOrders((response as PaginatedResponse<Order>).results);
        } else if (Array.isArray(response)) {
          setOrders(response as Order[]);
        } else {
          console.warn("getAdminOrders did not return a valid array or paginated response for recent orders:", response);
          setOrders([]);
        }

      } catch (err: any) {
        setError(err.message || "خطا در بارگذاری سفارشات اخیر.");
        console.error("Error fetching recent orders for admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentOrders();
  }, [accessToken, count]);

  const getStatusClass = (status?: string): string => { // status را اختیاری کنید
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    switch (status.toUpperCase()) { // به حروف بزرگ تبدیل کنید برای مقایسه بهتر
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
      case 'PENDING_PAYMENT':
      case 'AWAITING_PAYMENT': // اگر نام دیگری هم دارید
        return 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100';
      case 'CANCELLED':
      case 'PAYMENT_FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
      default:
        return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
    }
  };

  // تابع برای نمایش نام مشتری
  const getCustomerName = (order: Order): string => {
    if (order.user) {
      return order.user.first_name && order.user.last_name
        ? `${order.user.first_name} ${order.user.last_name}`
        : order.user.username;
    }
    // اگر اطلاعات مشتری مستقیماً در سفارش ذخیره شده (مثلاً برای مهمان)
    // if (order.customer_full_name) return order.customer_full_name;
    return 'کاربر مهمان';
  };

  return (
    <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-dark dark:text-white">{title}</h3>
        <RouterLink
          to="/admin/orders" // لینک به صفحه لیست کامل سفارشات ادمین
          className="text-sm text-primary hover:text-primary-dark dark:text-amber-400 dark:hover:text-amber-300 font-medium"
        >
          مشاهده همه
        </RouterLink>
      </div>

      {loading && (
        <div className="flex-grow flex items-center justify-center">
          <CircularProgress size={30} color="primary" />
          <Typography variant="body2" className="text-gray-500 dark:text-gray-400 mr-2">در حال بارگذاری...</Typography>
        </div>
      )}
      {error && !loading && (
        <div className="flex-grow flex items-center justify-center">
           <Alert severity="error" variant="outlined" className="w-full">{error}</Alert>
        </div>
      )}
      {!loading && !error && orders.length === 0 && (
        <div className="flex-grow flex items-center justify-center">
          <Typography variant="body2" className="text-gray-500 dark:text-gray-400">سفارش اخیری یافت نشد.</Typography>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="overflow-x-auto flex-grow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">شماره سفارش</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">مشتری</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">تاریخ</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">مبلغ</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">وضعیت</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">جزئیات</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    <RouterLink to={`/admin/orders/${order.id}`} className="hover:text-primary dark:hover:text-amber-400">
                      #{order.id} {/* یا هر فیلد دیگری که شماره سفارش شما را دارد */}
                    </RouterLink>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 hidden sm:table-cell">
                    {getCustomerName(order)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell">
                    {new Date(order.created_at).toLocaleDateString('fa-IR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {Number(order.total_price).toLocaleString('fa-IR')} تومان
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                      {order.status_display || order.status} {/* فرض بر اینکه status_display در تایپ Order هست یا خود status */}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <RouterLink
                      to={`/admin/orders/${order.id}`} // مسیر به جزئیات سفارش در پنل ادمین
                      className="text-primary hover:text-primary-dark dark:text-amber-400 dark:hover:text-amber-300 p-1"
                      title="مشاهده جزئیات سفارش"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </RouterLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentOrdersWidget;