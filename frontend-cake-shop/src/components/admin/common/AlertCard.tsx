import React from 'react';
// برای نمایش آیکون‌های متفاوت، از کتابخانه محبوب react-icons استفاده می‌کنیم
// npm install react-icons
import { FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';


// تعریف نوع برای واریانت‌های مختلف کارت
export type AlertVariant = 'success' | 'info' | 'warning' | 'error';

// تعریف پراپ‌های ورودی کامپوننت
interface AlertCardProps {
  variant: AlertVariant;
  message: string;
}


// یک آبجکت برای نگهداری استایل‌ها و آیکون‌های هر واریانت
const variantStyles: Record<AlertVariant, { container: string; icon: React.ReactNode; }> = {
  success: {
    container: "bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-900 dark:text-green-100",
    icon: <FaCheckCircle className="h-5 w-5 flex-shrink-0 mr-2 text-green-600" />
  },
  info: {
    container: "bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500 dark:border-blue-700 text-blue-900 dark:text-blue-100",
    icon: <FaInfoCircle className="h-5 w-5 flex-shrink-0 mr-2 text-blue-600" />
  },
  warning: {
    container: "bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100",
    icon: <FaExclamationTriangle className="h-5 w-5 flex-shrink-0 mr-2 text-yellow-600" />
  },
  error: {
    container: "bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100",
    icon: <FaTimesCircle className="h-5 w-5 flex-shrink-0 mr-2 text-red-600" />
  }
};



export const AlertCard: React.FC<AlertCardProps> = ({ variant, message }) => {
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`${styles.container} p-2 rounded-lg flex items-center transition duration-300 ease-in-out transform hover:scale-105`}
    >
      {styles.icon}
      <p className="text-xs font-semibold">{message}</p>
    </div>
  );
};