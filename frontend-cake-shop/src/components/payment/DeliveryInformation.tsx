// src/components/payment/DeliveryInformation.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faClock } from '@fortawesome/free-solid-svg-icons';
import { Address } from '../../types';

interface DeliveryInformationProps {
  address: Address | null | undefined;
  deliveryTime: string | null | undefined;
}

const DeliveryInformation: React.FC<DeliveryInformationProps> = ({ address, deliveryTime }) => {
  const formatAddress = (addr: Address | null | undefined): string => {
    if (!addr) {
      return "آدرس ثبت نشده است.";
    }
    return [addr.province_name, addr.city_name, addr.street, addr.postal_code]
      .filter(Boolean)
      .join('، ');
  };

  // --- تابع جدید برای فارسی‌سازی تاریخ و ساعت ---
  const formatPersianDateTime = (dateTimeString: string | null | undefined): string => {
    if (!dateTimeString) return "نامشخص";
    try {
      const date = new Date(dateTimeString);
      // گزینه‌ها برای نمایش کامل تاریخ و ساعت
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return date.toLocaleString('fa-IR', options);
    } catch (error) {
      // اگر فرمت تاریخ ورودی نامعتبر بود، همان رشته اولیه را برمی‌گرداند
      return dateTimeString;
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">اطلاعات تحویل</h2>
      <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg space-y-3">
        <div className="flex items-start">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-500 dark:text-gray-400 mt-1 ml-3" />
          <p className="text-gray-700 dark:text-gray-200">
            <span className="font-semibold">آدرس:</span> {formatAddress(address)}
          </p>
        </div>
        {deliveryTime && (
          <div className="flex items-start">
            <FontAwesomeIcon icon={faClock} className="text-gray-500 dark:text-gray-400 mt-1 ml-3" />
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-semibold">تخمین زمان تحویل:</span> 
              {formatPersianDateTime(deliveryTime)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryInformation;