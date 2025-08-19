// src/components/sms/SmsDetailsModal.tsx

import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { StatusBadge } from './StatusBadge';
import { SmsLog } from '@/types';

interface SmsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: SmsLog | null;
}

export const SmsDetailsModal: React.FC<SmsDetailsModalProps> = ({ isOpen, onClose, log }) => {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex items-center justify-center transition-opacity">
      <div className="bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full p-6">
        <div className="flex justify-between items-center border-b pb-3 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">جزئیات پیامک</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">متن کامل پیامک:</p>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-200">{log.content}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">وضعیت:</p>
              <StatusBadge status={log.status} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">تاریخ ارسال:</p>
              <p className="text-sm text-gray-900 dark:text-gray-200">{new Date(log.sent_at).toLocaleString('fa-IR')}</p>
            </div>
            {/* Add other details like cost, gateway_id etc. here */}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500">
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};