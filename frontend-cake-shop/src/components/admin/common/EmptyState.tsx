// src/components/admin/common/EmptyState.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'; // یا آیکون خاص

interface EmptyStateProps {
  icon: IconDefinition;
  title: string;
  message: string;
  actionButtonText?: string;
  onActionButtonClick?: () => void;
  actionButtonIcon?: IconDefinition;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionButtonText,
  onActionButtonClick,
  actionButtonIcon
}) => {
  return (
    <div className="empty-state bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 text-center border-2 border-dashed border-gray-300 dark:border-slate-700"> {/* از CSS سفارشی */}
      <FontAwesomeIcon icon={icon} className="text-4xl sm:text-5xl text-gray-400 dark:text-gray-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
      {actionButtonText && onActionButtonClick && (
        <button
          onClick={onActionButtonClick}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium inline-flex items-center"
        >
          {actionButtonIcon && <FontAwesomeIcon icon={actionButtonIcon} className="ml-2 rtl:mr-2" />}
          {actionButtonText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;