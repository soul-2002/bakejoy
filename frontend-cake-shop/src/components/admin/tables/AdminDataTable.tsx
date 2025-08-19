// src/components/admin/tables/AdminDataTable.tsx
import React, { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons'; // آیکون‌های نمونه برای عملیات
import './table.css'
// اینترفیس برای تعریف هر ستون
export interface TableColumn<T> {
  header: string; // متنی که در هدر نمایش داده می‌شود
  accessor: keyof T | string; // کلیدی از آبجکت داده یا یک رشته برای دسترسی به مقادیر تو در تو (مثلا 'user.name')
  render?: (item: T) => ReactNode; // تابع سفارشی برای رندر سلول (اختیاری)
  className?: string; // کلاس CSS برای th و td این ستون (اختیاری)
  headerClassName?: string; // کلاس CSS فقط برای th
  cellClassName?: string; // کلاس CSS فقط برای td
  sortable?: boolean; // آیا ستون قابل مرتب‌سازی است (پیاده‌سازی مرتب‌سازی بعداً)
}

interface AdminDataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onEditClick?: (item: T) => void;
  onDeleteClick?: (item: T) => void;
  onToggleActiveClick?: (item: T) => void; // برای تغییر وضعیت فعال/غیرفعال
  // سایر عملیات ...
  loading?: boolean;
  // Props برای انتخاب ردیف‌ها (اختیاری)
  selectableRows?: boolean;
  selectedRows?: Set<number | string>; // Set of selected item IDs
  onRowSelect?: (itemId: number | string, isSelected: boolean) => void;
  onSelectAllRows?: (isSelected: boolean) => void;
  getItemId: (item: T) => number | string; // تابعی برای گرفتن ID از هر آیتم
}

const AdminDataTable = <T extends object>({ // T باید یک آبجکت باشد
  columns,
  data,
  onEditClick,
  onDeleteClick,
  onToggleActiveClick,
  loading,
  selectableRows = false,
  selectedRows,
  onRowSelect,
  onSelectAllRows,
  getItemId,
}: AdminDataTableProps<T>) => {

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectAllRows) {
      onSelectAllRows(event.target.checked);
    }
  };

  const handleRowCheckboxChange = (item: T, event: React.ChangeEvent<HTMLInputElement>) => {
    if (onRowSelect) {
      onRowSelect(getItemId(item), event.target.checked);
    }
  };

  // تابع کمکی برای دسترسی به مقادیر تو در تو با استفاده از رشته accessor
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };


  if (loading) { // این بخش می‌تواند به AdminPageLayout منتقل شود
    return <div className="text-center py-10 text-gray-500 dark:text-gray-400">در حال بارگذاری داده‌ها...</div>;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
      <div className="table-responsive">
        <table className="table w-full">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              {selectableRows && (
                <th className={`w-10 px-4 py-3 ${columns[0]?.headerClassName || ''}`}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-amber-500 border-gray-300 dark:border-slate-600 rounded focus:ring-amber-500 dark:bg-slate-900"
                    onChange={handleSelectAll}
                    checked={data.length > 0 && selectedRows?.size === data.length}
                    disabled={data.length === 0}
                  />
                </th>
              )}
              {columns.map((col, index) => (
                <th key={index} className={`px-4 py-3 ${col.headerClassName || col.className || ''}`}>
                  {col.header}
                  {/* TODO: Add sort icons if col.sortable */}
                </th>
              ))}
              {(onEditClick || onDeleteClick || onToggleActiveClick) && (
                <th className={`w-32 px-4 py-3 ${columns[columns.length -1]?.headerClassName || ''}`}>عملیات</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {data.map((item, rowIndex) => (
              <tr key={getItemId(item)} className="table-row-hover dark:hover:bg-slate-700/50 text-sm text-gray-700 dark:text-gray-300">
                {selectableRows && (
                  <td className={`px-4 py-3 ${columns[0]?.cellClassName || ''}`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-amber-500 border-gray-300 dark:border-slate-600 rounded focus:ring-amber-500 dark:bg-slate-900"
                      checked={selectedRows?.has(getItemId(item))}
                      onChange={(e) => handleRowCheckboxChange(item, e)}
                    />
                  </td>
                )}
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={`px-4 py-3 ${col.cellClassName || col.className || ''} ${col.accessor === 'name' /* example */ ? 'font-medium text-gray-800 dark:text-gray-100' : ''}`}>
                    {col.render ? col.render(item) : String(getNestedValue(item, col.accessor as string) ?? '')}
                  </td>
                ))}
                {(onEditClick || onDeleteClick || onToggleActiveClick) && (
                  <td className={`px-4 py-3 ${columns[columns.length -1]?.cellClassName || ''}`}>
                    <div className="flex action-buttons space-x-1 space-x-reverse"> {/* از CSS سفارشی شما */}
                      {onToggleActiveClick && (item as any).is_active !== undefined && (
                        <button
                          onClick={() => onToggleActiveClick(item)}
                          title={(item as any).is_active ? "غیرفعال کردن" : "فعال کردن"}
                          className={`p-1.5 rounded 
                                      ${(item as any).is_active 
                                        ? 'text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300' 
                                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
                        >
                          <FontAwesomeIcon icon={(item as any).is_active ? faToggleOn : faToggleOff} size="lg" />
                        </button>
                      )}
                      {onEditClick && (
                        <button onClick={() => onEditClick(item)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded" title="ویرایش">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      )}
                      {onDeleteClick && (
                        <button onClick={() => onDeleteClick(item)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded" title="حذف">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDataTable;