// src/components/profile/OrderStatusCard.tsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkedAlt, faChevronDown } from '@fortawesome/free-solid-svg-icons';

import type { Order } from '../../types';
import OrderStatusBadge from './OrderStatusBadge';
import StatusTimeline from './StatusTimeline';

interface OrderStatusCardProps {
  order: Order;
}

const OrderStatusCard: React.FC<OrderStatusCardProps> = ({ order }) => {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // **تغییر ۳: شرط جدید برای نمایش دکمه پیگیری**
  const showTrackingButton = 
    (order.status === 'SHIPPED' || order.status === 'DELIVERED') && order.tracking_code;

    const handleTrackShipment = () => {
    if (!order.tracking_code) return;
    // URL پایه سایت شرکت پستی را اینجا قرار دهید
    const trackingUrl = `https://tracking.post.ir/?id=${order.tracking_code}`;
    // باز کردن لینک در تب جدید
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  };
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          {/* **تغییر ۱: افزایش فاصله با gap-4** */}
          <div className="flex items-center gap-4">
            <OrderStatusBadge statusText={order.status_display || order.status} />
            <span className="text-gray-500 text-sm">
              آخرین بروزرسانی: {new Date(order.updated_at).toLocaleString('fa-IR')}
            </span>
          </div>
          {order.tracking_code && (
            <p className="text-gray-700 mt-2">کد رهگیری پست: <span className="font-medium">{order.tracking_code}</span></p>
          )}
        </div>
        {/* **استفاده از شرط جدید** */}
        {showTrackingButton && (
          <button onClick={handleTrackShipment} className="mt-3 md:mt-0 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faMapMarkedAlt} />
            پیگیری مرسوله
          </button>
        )}
      </div>

      {/* بخش تایم‌لاین (بدون تغییر) */}
      <div className="mt-6 md:hidden">
        <button
          onClick={() => setIsTimelineOpen(!isTimelineOpen)}
          className="w-full flex justify-between items-center text-gray-700 font-medium py-2"
        >
          <span >تاریخچه وضعیت سفارش</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`transition-transform duration-200 ${isTimelineOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isTimelineOpen && (
          <div className="pt-4">
            <StatusTimeline history={order.status_logs || []} />
          </div>
        )}
      </div>

      <div className="hidden md:block mt-6">
        <h3 className="text-gray-700 font-medium mb-3">تاریخچه وضعیت سفارش</h3>
        <StatusTimeline history={order.status_logs || []} />
      </div>
    </div>
  );
};

export default OrderStatusCard;