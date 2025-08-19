// src/components/admin/orders/OrderInfoCard.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faCalendarAlt, faCreditCard, faMoneyBillWave, faTruck } from '@fortawesome/free-solid-svg-icons'; // آیکون‌های نمونه
import { Order,Transaction as TransactionType } from '../../../types'; // مسیر صحیح به تایپ Order شما
import { getStatusStyles } from '../../../pages/admin/orders/AdminOrderListPage';// با فرض اینکه getStatusStyles در این مسیر است

const getPaymentStatusStylesAndText = (transactions?: TransactionType[] | null, orderStatusKey?: string): { text: string; className: string; } => {
  if (transactions && transactions.length > 0) {
    const successfulTx = transactions.find(tx => tx.status?.toUpperCase() === 'SUCCESS' || tx.status?.toUpperCase() === 'COMPLETED');
    if (successfulTx) {
      return { text: successfulTx.status_display || 'موفق', className: 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400' };
    }
    const pendingTx = transactions.find(tx => tx.status?.toUpperCase() === 'PENDING');
    if (pendingTx) {
      return { text: pendingTx.status_display || 'در انتظار تایید', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-400' };
    }
    return { text: transactions[transactions.length -1].status_display || 'ناموفق', className: 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400' };
  }
  // اگر تراکنشی نیست، بر اساس وضعیت سفارش
  if (orderStatusKey?.toUpperCase() === 'PENDING_PAYMENT') {
    return { text: 'در انتظار پرداخت', className: 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-400' };
  }
  if (orderStatusKey && ['DELIVERED', 'PROCESSING', 'SHIPPED'].includes(orderStatusKey.toUpperCase())) {
    return { text: 'پرداخت شده (احتمالی)', className: 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400' };
  }
   if (orderStatusKey?.toUpperCase() === 'CANCELLED' || orderStatusKey?.toUpperCase() === 'PAYMENT_FAILED') {
    return { text: 'پرداخت نشده/لغو', className: 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400' };
  }
  return { text: 'نامشخص', className: 'bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-gray-300' };
};

interface OrderInfoCardProps {
  order: Order | null;
}


const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order }) => {
  const numericTotalPrice = order?.total_price ? parseFloat(order.total_price) : 0;

  let paymentMethodDisplayFromTx = 'نامشخص';
  if (order?.transactions && order.transactions.length > 0) {
    const successfulTx = order.transactions.find(tx => tx.status?.toUpperCase() === 'SUCCESS' || tx.status?.toUpperCase() === 'COMPLETED');
    if (successfulTx && successfulTx.payment_method_display) {
      paymentMethodDisplayFromTx = successfulTx.payment_method_display;
    } else if (order.transactions[0].payment_method_display) {
      paymentMethodDisplayFromTx = order.transactions[0].payment_method_display;
    } else if (order.transactions[0].payment_method) { // اگر فقط کلید بود
      // اینجا می‌توانید یک نگاشت از کلید به لیبل فارسی در فرانت‌اند هم داشته باشید اگر لازم شد
      paymentMethodDisplayFromTx = order.transactions[0].payment_method;
    }
  } else if (order?.status === 'PENDING_PAYMENT' && (!order?.transactions || order.transactions.length === 0)) {
    paymentMethodDisplayFromTx = 'آنلاین (در انتظار پرداخت)';
  }
  if (!order) {
    // می‌توانید یک اسکلت لودینگ (placeholder/skeleton) برای این کارت نمایش دهید
    // یا اگر کامپوننت والد لودینگ را مدیریت می‌کند، null برگردانید.
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // تابع کمکی برای نمایش وضعیت پرداخت (شبیه به getStatusStyles)
  const getPaymentStatusStyles = (paymentStatus?: string): string => {
    if (!paymentStatus) return 'bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-gray-300';
    switch (paymentStatus.toUpperCase()) {
      case 'COMPLETED': // یا هر مقداری که برای پرداخت موفق دارید
      case 'PAID':
        return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-400';
      case 'FAILED':
        return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-gray-300';
    }
  };

  // تابع کمکی برای نمایش وضعیت سفارش
  // از getStatusStyles که قبلا ساختیم استفاده می‌کنیم
  const orderStatusStyle = getStatusStyles(order.status);
  const paymentStatusInfo = getPaymentStatusStylesAndText(order.transactions, order.status);


  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
      <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4 flex items-center">
        <FontAwesomeIcon icon={faInfoCircle} className="ml-2 text-blue-500 dark:text-blue-400" />
        اطلاعات کلی سفارش
      </h2>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">شماره سفارش:</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">#{order.id?.toLocaleString('fa-IR')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">تاریخ ثبت:</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {order.created_at ? new Date(order.created_at).toLocaleString('fa-IR', { dateStyle: 'long', timeStyle: 'short' }) : '-'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">وضعیت سفارش:</span>
          <span className={`px-2 py-1 text-xs rounded-full ${orderStatusStyle}`}>
            {order.status_display || order.status}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">روش پرداخت:</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">{paymentMethodDisplayFromTx}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">وضعیت پرداخت:</span>
          {/* فرض می‌کنیم فیلدی مانند order.payment_status و order.payment_status_display در مدل Order شما وجود دارد */}
          <span className={`px-2 py-0.5 text-xs rounded-full ${getPaymentStatusStyles(paymentStatusInfo.text)}`}> {/* یا هر فیلد دیگری که وضعیت پرداخت را نشان می‌دهد */}
           {paymentStatusInfo.text}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">روش ارسال:</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">{order.shipping_method || '-'}</span>
        </div>
        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-slate-600 flex justify-between items-center">
          <span className="text-gray-700 dark:text-gray-300 font-semibold">مبلغ کل:</span>
          <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
            {numericTotalPrice.toLocaleString('fa-IR')} تومان
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderInfoCard;