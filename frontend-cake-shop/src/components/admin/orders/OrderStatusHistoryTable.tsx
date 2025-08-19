// src/components/admin/orders/OrderStatusHistoryTable.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext'; // مسیر صحیح
import { getAdminOrderStatusHistory } from '../../../services/api'; // تابع API جدید
import { OrderStatusLog } from '../../../types'; // اینترفیس از types.ts

interface OrderStatusHistoryTableProps {
    orderId: number | null;
}
const getStatusStyles = (statusKey?: string): string => {
  if (!statusKey) return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400';
  switch (statusKey.toUpperCase()) {
    case 'DELIVERED':
      return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400';
    case 'PROCESSING':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-400';
    case 'PENDING_PAYMENT':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-400';
    case 'CANCELLED':
    case 'PAYMENT_FAILED':
      return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400';
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-400';
    case 'CART':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400';
  }
};
const OrderStatusHistoryTable: React.FC<OrderStatusHistoryTableProps> = ({ orderId }) => {
    const { accessToken } = useAuth();
    const [statusLogs, setStatusLogs] = useState<OrderStatusLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatusHistory = useCallback(async () => {
        if (!orderId || !accessToken) return;
        setLoading(true);
        setError(null);
        try {
            // const logs = await getAdminOrderStatusHistory(accessToken, orderId);
            // setStatusLogs(logs);

            // ------ داده نمونه تا API آماده شود ------
            const logs = await getAdminOrderStatusHistory(accessToken, orderId);
            setStatusLogs(logs); // فرض می‌کنیم API مستقیماً آرایه لاگ‌ها را برمی‌گرداند
            // ------ پایان داده نمونه ------

        } catch (err: any) {
            console.error("Failed to fetch order status history:", err);
            setError(err.message || "خطا در دریافت تاریخچه وضعیت سفارش.");
        } finally {
            setLoading(false);
        }
    }, [accessToken, orderId]);

    useEffect(() => {
        fetchStatusHistory();
    }, [fetchStatusHistory]);

    if (loading) return <div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">در حال بارگذاری تاریخچه وضعیت...</div>;
    if (error) return <div className="p-4 text-sm text-center text-red-500 dark:text-red-400">خطا: {error}</div>;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
                <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 flex items-center">
                    <FontAwesomeIcon icon={faHistory} className="ml-2 rtl:mr-2 text-primary dark:text-amber-400" />
                    تاریخچه وضعیت سفارش
                </h2>
            </div>
            {statusLogs.length === 0 && !loading && (
                <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">تاریخچه‌ای برای نمایش وجود ندارد.</p>
            )}
            {statusLogs.length > 0 && (
                <div className="overflow-x-auto responsive-table">
                    <table className="w-full min-w-[500px]">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr className="text-right text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                <th className="px-3 sm:px-4 py-3 font-medium">تاریخ و زمان</th>
                                <th className="px-3 sm:px-4 py-3 font-medium">وضعیت جدید</th>
                                <th className="px-3 sm:px-4 py-3 font-medium">تغییر توسط</th>
                                <th className="px-3 sm:px-4 py-3 font-medium">توضیحات (اختیاری)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {statusLogs.map((log) => (
                                <tr key={log.id} className="text-right hover:bg-gray-50 dark:hover:bg-slate-700/50 text-sm text-gray-700 dark:text-gray-300">
                                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3">
                                        {/* استفاده از getStatusStyles برای رنگ‌بندی وضعیت */}
                                        <span className={`px-2 py-0.5 text-xs font-semibold leading-tight rounded-full ${getStatusStyles(log.new_status)}`}> {/* ممکن است نیاز به text-white داشته باشید اگر پس‌زمینه تیره است */}
                                            {log.new_status_display || log.new_status}
                                        </span>
                                    </td>
                                    {/* در OrderStatusLogSerializer ما changed_by_username را داشتیم */}
                                    <td className="px-3 sm:px-4 py-3">{log.changed_by_username || 'سیستم/نامشخص'}</td>
                                    <td className="px-3 sm:px-4 py-3 whitespace-pre-wrap">{log.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrderStatusHistoryTable;