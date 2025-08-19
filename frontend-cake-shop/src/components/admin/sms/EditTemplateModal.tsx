// src/components/admin/sms/EditTemplateModal.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaTimes, FaEye } from 'react-icons/fa';
import { SMSTemplate } from '../../../types'; // مسیر types را مطابق پروژه خود اصلاح کنید

//================================================================
// 1. SUB-COMPONENTS (کامپوننت‌های کوچک و داخلی)
//================================================================

// --- کامپوننت دکمه‌های متغیر ---
interface VariableButtonProps {
  label: string;
  variable: string;
  onClick: (variable: string) => void;
}
const VariableButton: React.FC<VariableButtonProps> = ({ label, variable, onClick }) => (
  <div
    onClick={() => onClick(variable)}
    className="border border-gray-200 dark:border-gray-600 rounded p-2 text-center text-sm cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800 transition-colors"
  >
    {label}
  </div>
);


//================================================================
// 2. MAIN MODAL COMPONENT (کامپوننت اصلی مودال)
//================================================================

interface EditTemplateModalProps {
  isOpen: boolean;
  template: SMSTemplate | null;
  onClose: () => void;
  onSave: (updatedTemplate: Partial<SMSTemplate>) => void;
}

export const EditTemplateModal: React.FC<EditTemplateModalProps> = ({
  isOpen,
  template,
  onClose,
  onSave,
}) => {
  const [currentContent, setCurrentContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // لیست متغیرهای قابل استفاده
  const TEMPLATE_VARIABLES = [
    { name: 'نام مشتری', value: '{{customer_name}}' },
    { name: 'شماره سفارش', value: '{{order_id}}' },
    { name: 'مبلغ سفارش', value: '{{order_total}}' },
    { name: 'کد رهگیری', value: '{{tracking_number}}' },
    { name: 'نام پست', value: '{{courier_name}}' },
    { name: 'زمان آماده‌سازی', value: '{{preparation_time}}' },
    { name: 'نام فروشگاه', value: '{{store_name}}' },
    { name: 'تلفن فروشگاه', value: '{{store_phone}}' },
  ];

  // با تغییر قالب ورودی، محتوای داخلی را آپدیت کن
  useEffect(() => {
    if (template) {
      // استفاده از نام فیلد صحیح که از API می‌آید
      setCurrentContent(template.message_template);
    }
  }, [template]);

  // محاسبه تعداد کاراکتر و پیامک
  const charCount = useMemo(() => currentContent.length, [currentContent]);
  const smsCount = useMemo(() => Math.ceil(charCount / 70), [charCount]); // فرض 70 کاراکتر برای هر پیامک فارسی

  // تابع برای درج متغیر در محل کرسر
  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + variable + text.substring(end);
    
    setCurrentContent(newText);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      textarea.focus();
    }, 0);
  };

  const handleSave = () => {
    if (template) {
      onSave({
        id: template.id,
        message_template: currentContent,
      });
    }
  };

  if (!isOpen || !template) return null;

  return (
    // این div، پس‌زمینه نیمه‌شفاف است
    <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 transition-opacity duration-300">
      
      {/* این div پنجره اصلی مودال است. کلاس‌های `bg-white` و `dark:bg-gray-800` 
        مسئول رنگ پس‌زمینه آن هستند. اگر پس‌زمینه شفاف است، فایل tailwind.config.js خود را چک کنید.
      */}
      <div className="relative p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-out">
        <div className="flex justify-between items-center border-b pb-3 dark:border-gray-600">
          {/* استفاده از نام فیلد صحیح */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">ویرایش قالب: {template.event_trigger_display}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <div className="mt-4">
          <label htmlFor="templateContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">متن پیامک</label>
          <textarea
            id="templateContent"
            ref={textareaRef}
            value={currentContent}
            onChange={(e) => setCurrentContent(e.target.value)}
            rows={5}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span>{charCount}</span> کاراکتر - <span>{smsCount}</span> پیامک
            </div>
            <div>
              {/* Preview functionality can be added here if needed */}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">متغیرهای قابل استفاده (برای افزودن کلیک کنید)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {TEMPLATE_VARIABLES.map(v => (
                <VariableButton key={v.value} label={v.name} variable={v.value} onClick={insertVariable} />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6 pt-3 border-t dark:border-gray-600">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-600">
            انصراف
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-primary hover:bg-yellow-600 text-white rounded-lg">
            ذخیره تغییرات
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTemplateModal;
