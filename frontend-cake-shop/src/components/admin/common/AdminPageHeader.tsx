// src/components/admin/common/AdminPageHeader.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

interface AdminPageHeaderProps {
  title: string;
  showDate?: boolean;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, showDate = true }) => {
  const today = new Date();
  // فرمت تاریخ به صورت فارسی (شما می‌توانید از کتابخانه‌ای مانند date-fns یا moment.js برای فرمت دقیق‌تر استفاده کنید)
  const formattedDate = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(today);

  return (
    <div className="flex items-center justify-between mb-6 md:mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-text-dark font-heading">{title}</h2>
      {showDate && (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <FontAwesomeIcon icon={faCalendarAlt} className="ml-2" />
          امروز: {formattedDate}
        </div>
      )}
    </div>
  );
};

export default AdminPageHeader;