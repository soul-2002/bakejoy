// src/components/sms/SmsLogTable.tsx

import React from 'react';
import { FaEye, FaRedo } from 'react-icons/fa';
import { StatusBadge } from './StatusBadge';
import { SmsLog } from '@/types'; // فرض می‌کنیم اینترفیس SmsLog را در types تعریف کرده‌اید

interface SmsLogTableProps {
  logs: SmsLog[];
  onViewDetails: (log: SmsLog) => void;
  onResend: (logId: number) => void;
}

export const SmsLogTable: React.FC<SmsLogTableProps> = ({ logs, onViewDetails, onResend }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">تاریخچه پیامک‌های ارسالی</h3>
        {/* TODO: Add Export and Columns buttons logic */}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {/* Table Headers */}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">تاریخ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">شماره تلفن</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">متن پیامک</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">وضعیت</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(log.sent_at).toLocaleString('fa-IR')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{log.phone_number}</td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{log.content}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={log.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button onClick={() => onViewDetails(log)} className="text-amber-600 hover:text-amber-800 ml-4">
                    <FaEye />
                  </button>
                  <button onClick={() => onResend(log.id)} className="text-gray-500 hover:text-gray-700">
                    <FaRedo />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       {/* TODO: Add Pagination component here */}
    </div>
  );
};