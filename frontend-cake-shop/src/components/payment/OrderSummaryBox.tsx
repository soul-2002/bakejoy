import React from 'react';
import { Order } from '../../types';

interface OrderSummaryBoxProps {
  order: Order | null;
}

const OrderSummaryBox: React.FC<OrderSummaryBoxProps> = ({ order }) => {
  if (!order) return null;

  return (
    <div className="order-summary p-4 md:p-6 mb-8 rtl">
      <h2 className="text-lg font-bold text-gray-800 mb-4">خلاصه سفارش</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">شماره سفارش:</h3>
          <p className="text-gray-800 font-medium font-mono">#{order.order_number}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">مبلغ قابل پرداخت:</h3>
          <p className="text-gray-800 font-medium">{parseFloat(order.total_price).toLocaleString('fa-IR')} تومان</p>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryBox;