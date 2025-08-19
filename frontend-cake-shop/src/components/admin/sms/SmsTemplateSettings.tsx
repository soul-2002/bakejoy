// src/components/admin/sms/SmsTemplateSettings.tsx

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faEdit } from '@fortawesome/free-solid-svg-icons';

//================================================================
// 1. TYPE DEFINITIONS (تعریف انواع داده)
//================================================================

export interface SMSTemplate {
  id: number | string;
  event_trigger_display: string;
  message_template: string;
  is_active: boolean;
}

//================================================================
// 2. SUB-COMPONENTS (کامپوننت‌های کوچک و داخلی)
//================================================================

// --- کامپوننت سوییچ با ظاهر جدید و بهبود یافته ---
interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (isChecked: boolean) => void;
  disabled?: boolean;
}
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, disabled }) => (
  <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="sr-only peer"
    />
      <div className={`w-10 h-10 rounded-full shadow-md transition-colors duration-300 ${checked ? 'bg-emerald-500' : 'bg-rose-400'} relative`}>
        <div className={`absolute top-1 left-1 h-8 w-8 rounded-full bg-gray-50 flex justify-center items-center text-lg transition-all duration-500 transform ${checked ? 'rotate-0 text-green-700' : '-rotate-180 text-red-600'}`}>
          {checked ? '✔️' : '✖️'}
        </div>
      </div>
  </label>
);


// --- کامپوننت هر ردیف از تنظیمات ---
interface SettingItemProps {
  template: SMSTemplate;
  onToggleActive: (id: number | string, newStatus: boolean) => void;
  onEditClick: (template: SMSTemplate) => void;
}
const SettingItem: React.FC<SettingItemProps> = ({ template, onToggleActive, onEditClick }) => (
  <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div className="mb-4 sm:mb-0">
      <h4 className="font-medium text-gray-800 dark:text-gray-100">{template.event_trigger_display}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        متن فعلی: 
        <span className="font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1 rounded-sm">
          {template.message_template}
        </span>
      </p>
    </div>
    <div className="flex items-center gap-x-6 space-x-6 space-x-reverse flex-shrink-0">
      <ToggleSwitch 
        id={`toggle-${template.id}`} 
        checked={template.is_active} 
        onChange={(isChecked) => onToggleActive(template.id, isChecked)} 
      />
      <button 
        onClick={() => onEditClick(template)} 
        className="text-primary hover:text-yellow-700 flex items-center gap-2"
      >
        <FontAwesomeIcon icon={faEdit} />
        ویرایش
      </button>
    </div>
  </div>
);


//================================================================
// 3. MAIN COMPONENT (کامپوننت اصلی)
//================================================================

interface SmsTemplateSettingsProps {
  templates: SMSTemplate[];
  loading: boolean;
  onToggleActive: (templateId: number | string, newStatus: boolean) => void;
  onEditClick: (template: SMSTemplate) => void;
}

const SmsTemplateSettings: React.FC<SmsTemplateSettingsProps> = ({
  templates,
  loading,
  onToggleActive,
  onEditClick,
}) => {
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-10">
          <FontAwesomeIcon icon={faSpinner} className="fa-spin text-primary text-2xl" />
          <span className="mr-3">در حال بارگذاری قالب‌ها...</span>
        </div>
      );
    }

    if (!templates || templates.length === 0) {
      return (
        <div className="text-center p-10 text-gray-500">
          هیچ قالبی یافت نشد.
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {templates.map(template => (
          <SettingItem
            key={template.id}
            template={template}
            onToggleActive={onToggleActive}
            onEditClick={onEditClick}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mt-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">قالب‌های اعلان سفارش</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          پیامک‌های ارسالی در مراحل مختلف سفارش را مدیریت کنید.
        </p>
      </div>
      {renderContent()}
    </div>
  );
};

export default SmsTemplateSettings;
