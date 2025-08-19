// src/components/admin/common/BulkActionsBar.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'; // مثال برای دکمه لغو انتخاب

export interface BulkActionItem {
  id: string;
  label: string;
  icon?: IconProp;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'secondary' | 'warning';
  disabled?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkActionItem[];
  onClearSelection?: () => void;
  entityName?: string; // نام موجودیت، مثلا "سفارش"
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  actions,
  onClearSelection,
  entityName = "آیتم" // مقدار پیش‌فرض
}) => {
  if (selectedCount === 0) {
    return null; // اگر هیچ آیتمی انتخاب نشده، چیزی نمایش نده
  }

  const getButtonClass = (variant?: string, disabled?: boolean) => {
    let baseClass = "ml-2 px-3 py-1.5 text-xs font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
    if (disabled) {
      return `${baseClass} bg-gray-400 cursor-not-allowed`;
    }
    switch (variant) {
      case 'primary':
        return `${baseClass} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
      case 'danger':
        return `${baseClass} bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      case 'warning':
        return `${baseClass} bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400`;
      case 'secondary':
      default:
        return `${baseClass} bg-gray-500 hover:bg-gray-600 focus:ring-gray-400`;
    }
  };

  return (
    <div className="mb-4 p-3 bg-amber-50 dark:bg-slate-700 border border-amber-200 dark:border-slate-600 rounded-lg flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          {selectedCount.toLocaleString('fa-IR')} {entityName} انتخاب شده است.
        </p>
        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="mr-3 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            title="لغو انتخاب همه"
          >
            <FontAwesomeIcon icon={faTimesCircle} className="ml-1" />
            لغو انتخاب
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={getButtonClass(action.variant, action.disabled)}
          >
            {action.icon && <FontAwesomeIcon icon={action.icon} className="ml-2" />}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BulkActionsBar;