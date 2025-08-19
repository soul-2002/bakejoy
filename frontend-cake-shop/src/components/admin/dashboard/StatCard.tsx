// src/components/admin/dashboard/StatCard.tsx
import React from 'react';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core'; // برای تایپ آیکون
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'; // برای درصد تغییرات

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string; // مثلا "تومان" یا "سفارش"
  icon: IconProp; // آیکون اصلی کارت
  iconBgColor?: string; // مثلا 'bg-amber-100'
  iconTextColor?: string; // مثلا 'text-amber-600'
  percentageChange?: number; // درصد تغییرات (مثبت یا منفی)
  changePeriod?: string; // مثلا "نسبت به دیروز"
  loading?: boolean;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon,
  iconBgColor = 'bg-gray-100 dark:bg-gray-700',
  iconTextColor = 'text-gray-600 dark:text-gray-300',
  percentageChange,
  changePeriod,
  loading,
  className,
}) => {
  const isPositiveChange = percentageChange !== undefined && percentageChange >= 0;

  return (
    <div className={`card-hover bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6 transition-all duration-300 hover:shadow-xl ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="h-8 my-1 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse w-3/4"></div>
          ) : (
            <p className="text-2xl font-bold text-text-dark dark:text-white mt-1">
              {value} {unit && <span className="text-sm font-normal">{unit}</span>}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <FontAwesomeIcon icon={icon} className={`${iconTextColor} text-xl`} />
        </div>
      </div>
      {!loading && percentageChange !== undefined && changePeriod && (
        <div className="mt-4 flex items-center text-xs sm:text-sm">
          <span className={`flex items-center ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
            <FontAwesomeIcon icon={isPositiveChange ? faArrowUp : faArrowDown} className="ml-1" />
            {Math.abs(percentageChange)}%
          </span>
          <span className="text-gray-500 dark:text-gray-400 mr-1">{changePeriod}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;