// src/components/admin/orders/OrderDetailHeader.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faEdit, faEnvelope, faUndo, faTimes } from '@fortawesome/free-solid-svg-icons'; // آیکون‌های نمونه
import { Order } from '../../../types'; // مسیر صحیح به تایپ Order شما
import { getStatusStyles } from '../../../pages/admin/orders/AdminOrderListPage'; // اگر تابع getStatusStyles در آنجا تعریف شده و export شده

interface OrderDetailHeaderProps {
  order: Order | null;
  onPrintInvoiceClick: () => void;
  onSendEmailClick: () => void;    // تابع برای ارسال ایمیل
  onRefundClick: () => void;       // تابع برای بازپرداخت
  onCancelOrderClick: () => void; // تابع برای لغو سفارش
  onChangeStatusClick?: () => void; // اگر دکمه مجزای "تغییر وضعیت" هم دارید
}

const OrderDetailHeader: React.FC<OrderDetailHeaderProps> = ({
  order,
  onPrintInvoiceClick,
  onSendEmailClick,
  onRefundClick,
  onCancelOrderClick,
  onChangeStatusClick
}) => {
  if (!order) {
    return null;
  }
  const primaryButtonClass = "bg-amber-500 text-white px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-amber-600 transition flex items-center";
  const secondaryButtonClass = "bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition flex items-center";
  const dangerButtonClass = "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-800/40 transition flex items-center";
  // اگر getStatusStyles را از AdminOrderListPage وارد نکرده‌اید، می‌توانید آن را مجدداً اینجا تعریف کنید یا از یک فایل utils مشترک وارد کنید.
  // const statusStyle = getStatusStyles(order.status); // نیاز به تابع getStatusStyles

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* بخش اطلاعات وضعیت سفارش */}
        <div className="flex items-center">
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">وضعیت فعلی سفارش</p>
            <div className="flex items-center mt-1">
              <span className={`px-3 py-1 text-sm rounded-full ${getStatusStyles(order.status)}`}> {/* استفاده از getStatusStyles */}
                {order.status_display || order.status}
              </span>
              {order.updated_at && (
                <span className="mr-3 text-xs text-gray-400 dark:text-gray-500">
                  آخرین تغییر: {new Date(order.updated_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* بخش دکمه‌های عملیات */}
        <div className="flex flex-wrap gap-1.5 space-x-reverse rtl:space-x-reverse"> {/* flex-wrap برای چند خط شدن دکمه‌ها در موبایل */}
          <button
            onClick={onPrintInvoiceClick}
            className="bg-amber-500 text-white px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-amber-600 transition flex items-center"
          >
            <FontAwesomeIcon icon={faPrint} className="ml-2" />
            چاپ فاکتور
          </button>

          <button
            onClick={onSendEmailClick}
            className={secondaryButtonClass} // استفاده از کلاس پایه
          >
            <FontAwesomeIcon icon={faEnvelope} className="ml-2 rtl:mr-2" />
            ارسال ایمیل
          </button>
          {/* {canRefundOrder && ( // دکمه بازپرداخت را فقط در صورت امکان نمایش بده
            <button 
              onClick={onRefundClick}
              className={secondaryButtonClass} // استفاده از کلاس پایه
            >
              <FontAwesomeIcon icon={faUndo} className="ml-2 rtl:mr-2" />
              بازپرداخت
            </button>
          )} */}
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && ( // مثال: فقط اگر سفارش لغو یا تحویل نشده باشد
            <button onClick={onCancelOrderClick} className="bg-red-500 text-white px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-red-600 transition flex items-center">
              <FontAwesomeIcon icon={faTimes} className="ml-2" />
              لغو سفارش
            </button>
          )}
          {onChangeStatusClick && (
            <button
              onClick={onChangeStatusClick}
              className="bg-blue-500 text-white px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-blue-600 transition flex items-center"
            >
              <FontAwesomeIcon icon={faEdit} className="ml-2 rtl:mr-2" />
              تغییر وضعیت
            </button>
          )}


        </div>
      </div>
    </div>
  );
};

export default OrderDetailHeader;