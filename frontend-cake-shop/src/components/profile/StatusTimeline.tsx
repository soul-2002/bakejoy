// src/components/profile/StatusTimeline.tsx
import React from 'react';
import type { OrderStatusLog } from '../../types';

interface StatusTimelineProps {
  history: OrderStatusLog[];
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="text-gray-500">تاریخچه‌ای برای نمایش وجود ندارد.</p>;
  }

  return (
    // **تغییر ۲: کلاس‌های زیر خط را در سمت راست قرار می‌دهند**
    <div className="border-r-2 border-gray-200 pr-4 space-y-4">
      {history.map((item) => (
        <div key={item.id} className="relative pr-2">
          {/* **این کلاس نقطه را روی خط سمت راست قرار می‌دهد** */}
          <div className="absolute w-3 h-3 bg-green-500 rounded-full -right-[7px] top-1 border-2 border-white"></div>
          <div>
            <p className="text-sm font-medium text-gray-800">{item.new_status_display}</p>
            <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString('fa-IR')}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusTimeline;