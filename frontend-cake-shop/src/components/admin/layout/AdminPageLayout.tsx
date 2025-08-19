// src/components/admin/layout/AdminPageLayout.tsx
import React, { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileExport, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons'; // آیکون‌های لازم

interface FilterOption {
  value: string;
  label: string;
}

interface AdminPageLayoutProps {
  pageTitle: string;
  onAddNewClick?: () => void; // تابع برای دکمه افزودن جدید
  onExportClick?: () => void; // تابع برای دکمه خروجی
  showExportButton?: boolean;
  onSearchChange?: (searchTerm: string) => void;
  searchPlaceholder?: string;
  filterSections?: {
    label: string;
    options: FilterOption[];
    currentValue: string;
    onFilterChange: (value: string) => void;
  }[];
  onApplyFiltersClick?: () => void; // اگر دکمه فیلتر جداگانه دارید
  children: ReactNode; // محتوای اصلی صفحه (معمولاً جدول و Pagination)
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
  pageTitle,
  onAddNewClick,
  onExportClick,
  showExportButton = false,
  onSearchChange,
  searchPlaceholder = "جستجو...",
  filterSections,
  onApplyFiltersClick,
  children,
}) => {
  return (
    <> {/* از Fragment استفاده می‌کنیم چون main در AdminLayout.tsx است */}
      {/* Page Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 md:mb-0">
          {pageTitle}
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
          {showExportButton && onExportClick && (
            <button
              onClick={onExportClick}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 text-sm font-medium flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faFileExport} className="ml-2 rtl:mr-2" />
              خروجی اکسل
            </button>
          )}
          {onAddNewClick && (
            <button
              onClick={onAddNewClick}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faPlus} className="ml-2 rtl:mr-2" />
              افزودن {pageTitle.replace('مدیریت ', '')} جدید {/* مثلا افزودن دسته‌بندی جدید */}
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search Section */}
      {(onSearchChange || filterSections) && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {onSearchChange && (
              <div className="md:col-span-2 lg:col-span-2"> {/* تنظیم عرض برای جستجو */}
                <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  جستجو
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search-input"
                    className="w-full px-3 py-2 pr-10 rtl:pl-10 rtl:pr-3 border border-gray-300 dark:border-slate-600 rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                               bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                    placeholder={searchPlaceholder}
                    onChange={(e) => onSearchChange(e.target.value)}
                  />
                  <span className="absolute left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                </div>
              </div>
            )}

            {filterSections?.map((section, index) => (
              <div key={index}>
                <label htmlFor={`filter-${section.label}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {section.label}
                </label>
                <select
                  id={`filter-${section.label}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                             bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 appearance-none pr-7 rtl:pl-7 rtl:pr-3"
                  value={section.currentValue}
                  onChange={(e) => section.onFilterChange(e.target.value)}
                >
                  {section.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {/* آیکون Chevron برای select (اگر نیاز به استایل سفارشی دارید) */}
              </div>
            ))}
            
            {onApplyFiltersClick && (
                 <div className="md:col-start-4 flex justify-end"> {/* دکمه فیلتر در انتهای گرید */}
                    <button 
                        onClick={onApplyFiltersClick}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition flex items-center justify-center self-end"
                    >
                        <FontAwesomeIcon icon={faFilter} className="ml-2 rtl:mr-2" />
                        <span>اعمال فیلتر</span>
                    </button>
                </div>
            )}
          </div>
        </div>
      )}

      {/* محتوای اصلی صفحه (جدول و Pagination) در اینجا رندر می‌شود */}
      {children}
    </>
  );
};

export default AdminPageLayout;