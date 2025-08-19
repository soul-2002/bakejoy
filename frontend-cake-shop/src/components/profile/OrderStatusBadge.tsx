import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faBox, faCheckCircle, faTimesCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import type { OrderStatusKey } from '../../types';

interface OrderStatusBadgeProps {
  // این پراپ حالا می‌تواند هر رشته‌ای را بپذیرد
  statusText: string;
}

// این یک مپینگ برای تبدیل وضعیت‌های بک‌اند به کلیدهای استایل ماست
// شما باید این مپینگ را مطابق با وضعیت‌های واقعی بک‌اند خود کامل کنید
const statusKeyMap: { [key: string]: OrderStatusKey } = {
  'CART': 'processing',
  'PENDING_PAYMENT': 'processing',
  'PROCESSING': 'processing',
  'SHIPPED': 'shipped',
  'DELIVERED': 'delivered',
  'CANCELLED': 'cancelled',
};

const statusConfig = {
  processing: { text: 'در حال پردازش', icon: faBox, className: 'order-status-processing' },
  shipped: { text: 'ارسال شده', icon: faTruck, className: 'order-status-shipped' },
  delivered: { text: 'تحویل داده شده', icon: faCheckCircle, className: 'order-status-delivered' },
  cancelled: { text: 'لغو شده', icon: faTimesCircle, className: 'order-status-cancelled' },
  // یک وضعیت پیش‌فرض برای موارد ناشناخته
  unknown: { text: 'نامشخص', icon: faQuestionCircle, className: 'bg-gray-200 text-gray-700' },
};

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ statusText }) => {
  // ابتدا سعی می‌کنیم کلید وضعیت بک‌اند را به کلید استایل خودمان تبدیل کنیم
  const styleKey = statusKeyMap[statusText.toUpperCase()] || 'unknown';
  
  // سپس از کلید استایل برای گرفتن کانفیگ استفاده می‌کنیم
  const config = statusConfig[styleKey];

  // در اینجا متن نمایشی را از خود پراپ می‌گیریم تا متن فارسی API نمایش داده شود
  const displayText = config.text === 'نامشخص' ? statusText : config.text;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${config.className}`}>
      <FontAwesomeIcon icon={config.icon} />
      {displayText}
    </span>
  );
};

export default OrderStatusBadge;