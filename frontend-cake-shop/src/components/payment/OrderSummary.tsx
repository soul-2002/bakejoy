// src/components/payment/OrderSummary.tsx
import React from 'react';
import { Order } from '../../types';

interface OrderSummaryProps {
  order: Order;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
  const displayDate = order.created_at ? new Date(order.created_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }) : 'نامشخص';
  const displayPrice = !isNaN(parseFloat(String(order.total_price))) 
    ? `${parseFloat(String(order.total_price)).toLocaleString('fa-IR')} تومان` 
    : 'نامشخص';
    
  return (
    <div className="bg-amber-50 dark:bg-slate-700/50 border border-amber-200 dark:border-slate-600 rounded-lg p-4 md:p-6 mb-8">
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-sm">شماره سفارش:</h3>
          <p className="text-gray-800 dark:text-gray-100 font-medium">{order.order_number || `#${order.id}`}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-sm">تاریخ سفارش:</h3>
          <p className="text-gray-800 dark:text-gray-100 font-medium">{displayDate}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-sm">مبلغ کل:</h3>
          <p className="text-gray-800 dark:text-gray-100 font-medium">{displayPrice}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-sm">روش پرداخت:</h3>
          <p className="text-gray-800 dark:text-gray-100 font-medium">
            {order.payment_method || 'درگاه اینترنتی'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;