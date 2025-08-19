import React from 'react';
import { FaEdit } from 'react-icons/fa';
// این دو کامپوننت را از فایل‌های دیگر ایمپورت می‌کنیم
// import { ToggleSwitch } from './ToggleSwitch'; 
// import { SMSTemplate } from '../../../types';

// (تعاریف موقت برای کامل بودن کد)
export interface SMSTemplate {
  id: number | string;
  event_trigger_display: string;
  message_template: string;
  is_active: boolean;
}
const ToggleSwitch: React.FC<{ id: string; checked: boolean; onChange: (c: boolean) => void; }> = ({ id, checked, onChange }) => (/* ... پیاده‌سازی سوییچ ... */ <div>{checked ? 'On' : 'Off'}</div>);


interface NotificationSettingItemProps {
  template: SMSTemplate;
  onToggleActive: (id: number | string, newStatus: boolean) => void;
  onEditClick: (template: SMSTemplate) => void;
}

export const NotificationSettingItem: React.FC<NotificationSettingItemProps> = ({ template, onToggleActive, onEditClick }) => (
  <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div className="mb-4 sm:mb-0">
      {/* --- اصلاح شده: استفاده از نام فیلدهای صحیح --- */}
      <h4 className="font-medium text-gray-800 dark:text-gray-100">{template.event_trigger_display}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        متن فعلی: <span className="font-mono text-gray-600 dark:text-gray-300">{template.message_template}</span>
      </p>
    </div>
    <div className="flex items-center space-x-4 space-x-reverse flex-shrink-0">
      <ToggleSwitch 
        id={`toggle-${template.id}`} 
        checked={template.is_active} 
        onChange={(isChecked) => onToggleActive(template.id, isChecked)} 
      />
      <button 
        onClick={() => onEditClick(template)} 
        className="text-primary hover:text-yellow-700 flex items-center gap-2"
      >
        <FaEdit /> ویرایش
      </button>
    </div>
  </div>
);

