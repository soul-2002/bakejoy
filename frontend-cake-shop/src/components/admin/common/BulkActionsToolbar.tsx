// src/components/admin/common/BulkActionsToolbar.tsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare, faCaretDown } from '@fortawesome/free-solid-svg-icons';

export interface BulkActionOption { // این اینترفیس را از اینجا export کنید اگر در جای دیگر هم لازم است
  value: string;  // مقدار داخلی برای شناسایی عملیات
  label: string;  // متنی که در لیست کشویی نمایش داده می‌شود
  icon?: any;      // IconDefinition (اختیاری، فعلاً در select استفاده نشده)
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  onActionSelect: (actionValue: string) => void; // مقدار value عملیات انتخاب شده را برمی‌گرداند
  actionOptions: BulkActionOption[];
  entityName?: string; // برای نمایش پیام "X آیتم انتخاب شده"
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onActionSelect,
  actionOptions,
  entityName = "آیتم" // مقدار پیش‌فرض
}) => {
  const [selectedActionValue, setSelectedActionValue] = useState<string>(''); // نگهداری value عملیات

  const handleApplyAction = () => {
    if (!selectedActionValue) {
      alert("لطفاً یک عملیات را از لیست انتخاب کنید.");
      return;
    }
    if (selectedCount === 0) { // این شرط معمولاً لازم نیست چون کامپوننت فقط وقتی selectedCount > 0 است نمایش داده می‌شود
        alert("هیچ آیتمی انتخاب نشده است.");
        return;
    }
    onActionSelect(selectedActionValue); // مقدار value عملیات را به والد پاس بده
    setSelectedActionValue(''); // ریست کردن انتخاب پس از اعمال
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div 
      className="
        bg-amber-50 dark:bg-amber-800/20 
        border border-amber-300 dark:border-amber-700/50 
        rounded-lg p-3 mb-4 
        flex flex-col sm:flex-row items-center justify-between gap-3
        transition-all duration-300 ease-in-out
      "
    >
      <div className="flex items-center">
        <FontAwesomeIcon icon={faCheckSquare} className="text-amber-600 dark:text-amber-400 ml-2 rtl:mr-2 rtl:ml-0" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
          <span className="font-bold">{selectedCount.toLocaleString('fa-IR')}</span> {entityName} انتخاب شده است
        </span>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
        <div className="relative flex-grow sm:flex-grow-0">
          <select
            value={selectedActionValue}
            onChange={(e) => setSelectedActionValue(e.target.value)}
            className="
              w-full appearance-none py-2 pl-3 pr-8 rtl:pl-8 rtl:pr-3 
              border border-amber-300 dark:border-amber-600 
              rounded-lg text-sm 
              bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
            "
            aria-label="انتخاب عملیات گروهی"
          >
            <option value="">عملیات گروهی...</option> {/* گزینه پیش‌فرض */}
            {actionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FontAwesomeIcon 
            icon={faCaretDown} 
            className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
          />
        </div>
        <button
          onClick={handleApplyAction}
          disabled={!selectedActionValue || selectedCount === 0} // دکمه غیرفعال اگر عملیاتی انتخاب نشده
          className="
            px-4 py-2 bg-amber-500 text-white 
            rounded-lg hover:bg-amber-600 
            text-sm font-medium transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            w-full sm:w-auto
          "
        >
          اعمال
        </button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;