// src/components/sms/StatusBadge.tsx

import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

type SmsStatus = 'success' | 'failed' | 'pending';

interface StatusBadgeProps {
  status: SmsStatus;
}

const statusStyles = {
  success: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-700 dark:text-green-300',
    icon: <FaCheckCircle className="ml-1" />,
    label: 'ارسال موفق',
  },
  failed: {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-700 dark:text-red-300',
    icon: <FaTimesCircle className="ml-1" />,
    label: 'ارسال ناموفق',
  },
  pending: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
    icon: <FaClock className="ml-1" />,
    label: 'در حال ارسال',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = statusStyles[status] || statusStyles.pending;

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles.bg} ${styles.text}`}>
      {styles.icon}
      {styles.label}
    </span>
  );
};