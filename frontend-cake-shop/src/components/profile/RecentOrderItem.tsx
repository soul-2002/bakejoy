import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import type { Order } from '../../types'; // مسیر تایپ Order شما

const RecentOrderItem = ({ order }: { order: Order }) => {
  const navigate = useNavigate();

  const getStatusClasses = (statusKey?: string): string => {
    const key = statusKey?.toLowerCase() || '';
    // می‌توانید کلیدهای وضعیت بک‌اند خود را هم اینجا اضافه کنید
    if (key.includes('processing') || key.includes('pending')) return 'order-status-processing';
    if (key.includes('shipped')) return 'order-status-shipped';
    if (key.includes('delivered')) return 'order-status-delivered';
    if (key.includes('cancelled') || key.includes('failed')) return 'order-status-cancelled';
    return 'bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200';
  };

  // بررسی می‌کنیم که داده‌ها معتبر هستند قبل از نمایش
  const displayDate = order.created_at ? new Date(order.created_at).toLocaleDateString('fa-IR') : 'نامشخص';
  const displayPrice = !isNaN(parseFloat(String(order.total_price)))
    ? `${parseFloat(String(order.total_price)).toLocaleString('fa-IR')} تومان`
    : 'نامشخص';

  return (
    <tr
      className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
      onClick={() => navigate(`/profile/orders/${order.id}`)}
    >
      <td className="py-4 px-2 sm:px-4 font-medium text-amber-600">{order.order_number || `#${order.id}`}</td>
      <td className="py-4 px-2 sm:px-4 text-sm text-gray-500 dark:text-gray-400">{displayDate}</td>
      <td className="py-4 px-2 sm:px-4 font-medium text-gray-800 dark:text-gray-100">{displayPrice}</td>
      <td className="py-4 px-2 sm:px-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(order.status)}`}>
          {order.status_display || order.status || 'نامشخص'}
        </span>
      </td>
      <td className="py-4 px-2 sm:px-4 text-left rtl:text-right">
        <span className="text-amber-600 hover:text-amber-700 dark:text-amber-400 text-sm flex items-center justify-end">
          <span>جزئیات</span>
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs mr-1 rtl:ml-1" />
        </span>
      </td>
    </tr>
  );
};

export default RecentOrderItem;