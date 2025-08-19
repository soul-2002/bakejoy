// src/components/admin/dashboard/QuickActionsWidget.tsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlusCircle, // افزودن محصول
  faTags,       // ایجاد کد تخفیف
  faBullhorn,   // ایجاد کمپین
  faFileExport  // خروجی گزارش
} from '@fortawesome/free-solid-svg-icons';

interface QuickActionItem {
  label: string;
  href: string;
  icon: any; // IconProp از FontAwesome
  bgColorClass: string; // مثال: 'bg-amber-50 dark:bg-gray-700'
  textColorClass: string; // مثال: 'text-amber-700 dark:text-amber-300'
  hoverBgColorClass: string; // مثال: 'hover:bg-amber-100 dark:hover:bg-gray-600'
}

const quickActions: QuickActionItem[] = [
  {
    label: 'افزودن محصول جدید',
    href: '/admin/products/new',
    icon: faPlusCircle,
    bgColorClass: 'bg-amber-50 dark:bg-gray-700',
    textColorClass: 'text-amber-700 dark:text-amber-300',
    hoverBgColorClass: 'hover:bg-amber-100 dark:hover:bg-gray-600',
  },
  {
    label: 'ایجاد کد تخفیف',
    href: '/admin/discounts/new', // مسیر را با مسیر واقعی خودتان جایگزین کنید
    icon: faTags,
    bgColorClass: 'bg-blue-50 dark:bg-gray-700',
    textColorClass: 'text-blue-700 dark:text-blue-300',
    hoverBgColorClass: 'hover:bg-blue-100 dark:hover:bg-gray-600',
  },
  {
    label: 'ایجاد کمپین تبلیغاتی',
    href: '#', // مسیر را با مسیر واقعی خودتان جایگزین کنید
    icon: faBullhorn,
    bgColorClass: 'bg-green-50 dark:bg-gray-700',
    textColorClass: 'text-green-700 dark:text-green-300',
    hoverBgColorClass: 'hover:bg-green-100 dark:hover:bg-gray-600',
  },
  {
    label: 'خروجی گزارش فروش',
    href: '/admin/reports/sales?export=true', // مسیر را با مسیر واقعی خودتان جایگزین کنید
    icon: faFileExport,
    bgColorClass: 'bg-purple-50 dark:bg-gray-700',
    textColorClass: 'text-purple-700 dark:text-purple-300',
    hoverBgColorClass: 'hover:bg-purple-100 dark:hover:bg-gray-600',
  },
];

const QuickActionsWidget: React.FC = () => {
  return (
    <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6">
      <h3 className="text-lg font-semibold text-text-dark dark:text-white mb-4">عملیات سریع</h3>
      <div className="space-y-3">
        {quickActions.map((action) => (
          <RouterLink
            key={action.label}
            to={action.href}
            className={`flex items-center p-3 text-sm font-medium rounded-lg transition-colors duration-200 ${action.bgColorClass} ${action.textColorClass} ${action.hoverBgColorClass}`}
          >
            <FontAwesomeIcon icon={action.icon} className="ml-2.5 w-5 h-5" />
            <span>{action.label}</span>
          </RouterLink>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsWidget;