// src/components/admin/orders/OrderTransactionsTable.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faCheckCircle, faTimesCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import { Transaction as TransactionType } from '../../../types'; // مسیر صحیح به تایپ‌های شما

interface OrderTransactionsTableProps {
  transactions?: TransactionType[] | null;
}

// تابع کمکی برای استایل وضعیت تراکنش (می‌توانید مشابه getStatusStyles بسازید)
const getTransactionStatusStyles = (statusKey?: string): { textClass: string; bgClass: string; icon: any } => {
  if (!statusKey) return { textClass: 'text-gray-700', bgClass: 'bg-gray-100', icon: faClock };
  switch (statusKey.toUpperCase()) {
    case 'SUCCESS': // یا 'COMPLETED' یا هر مقداری که در بک‌اند برای موفقیت دارید
      return { textClass: 'text-green-700 dark:text-green-400', bgClass: 'bg-green-100 dark:bg-green-700/30', icon: faCheckCircle };
    case 'PENDING':
      return { textClass: 'text-yellow-700 dark:text-yellow-400', bgClass: 'bg-yellow-100 dark:bg-yellow-700/30', icon: faClock };
    case 'FAILED':
      return { textClass: 'text-red-700 dark:text-red-400', bgClass: 'bg-red-100 dark:bg-red-700/30', icon: faTimesCircle };
    default:
      return { textClass: 'text-gray-700 dark:text-gray-400', bgClass: 'bg-gray-100 dark:bg-slate-600', icon: faClock };
  }
};

const OrderTransactionsTable: React.FC<OrderTransactionsTableProps> = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 mt-6">
        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-3 flex items-center">
          <FontAwesomeIcon icon={faCreditCard} className="ml-2 rtl:mr-2 text-gray-500 dark:text-gray-400" />
          تاریخچه تراکنش‌ها
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">هیچ تراکنشی برای این سفارش ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden mt-6">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 flex items-center">
          <FontAwesomeIcon icon={faCreditCard} className="ml-2 rtl:mr-2 text-gray-700 dark:text-gray-300" />
          تاریخچه تراکنش‌ها
        </h2>
      </div>
      <div className="overflow-x-auto responsive-table">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr className="text-right text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <th className="px-3 sm:px-4 py-3 font-medium">تاریخ و زمان</th>
              <th className="px-3 sm:px-4 py-3 font-medium">مبلغ</th>
              <th className="px-3 sm:px-4 py-3 font-medium">وضعیت</th>
              <th className="px-3 sm:px-4 py-3 font-medium">کد رهگیری درگاه</th>
              <th className="px-3 sm:px-4 py-3 font-medium">کد رهگیری نهایی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {transactions.map((tx) => {
              const statusStyle = getTransactionStatusStyles(tx.status);
              return (
                <tr key={tx.id} className="text-right hover:bg-gray-50 dark:hover:bg-slate-700/50 text-sm text-gray-700 dark:text-gray-300">
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-3 sm:px-4 py-3 ltr-text">{parseFloat(tx.amount).toLocaleString('fa-IR')} تومان</td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold leading-tight rounded-full ${statusStyle.bgClass} ${statusStyle.textClass}`}>
                      <FontAwesomeIcon icon={statusStyle.icon} className="ml-1 rtl:mr-1" />
                      {tx.status_display || tx.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">{tx.gateway_reference_id || '-'}</td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">{tx.ref_id || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTransactionsTable;
