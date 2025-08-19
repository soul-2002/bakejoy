// src/pages/admin/SmsSettingsPage.tsx

import React, { useState, useEffect } from 'react';
import  AdminPageHeader  from '../../components/admin/common/AdminPageHeader'; // کامپوننت هدر شما
import { NotificationSettingItem, NotificationTemplate } from '../../components/admin/sms/NotificationSettingItem';
import { EditTemplateModal } from '../../components/admin/sms/EditTemplateModal';
import { FaPlus } from 'react-icons/fa';

// داده‌های نمونه - در اپلیکیشن واقعی این داده‌ها از API گرفته می‌شوند
const MOCK_TEMPLATES: NotificationTemplate[] = [
    { id: 'toggle1', title: 'سفارش جدید ثبت شد (تاییدیه برای مشتری)', content: 'سفارش شماره {{order_id}} با موفقیت ثبت شد.', isActive: true },
    { id: 'toggle2', title: 'سفارش در حال پردازش است', content: 'سفارش شماره {{order_id}} در حال پردازش می‌باشد.', isActive: true },
    { id: 'toggle3', title: 'سفارش آماده تحویل/ارسال است', content: 'سفارش شماره {{order_id}} آماده تحویل می‌باشد.', isActive: false },
    { id: 'toggle4', title: 'سفارش ارسال شد', content: 'سفارش شماره {{order_id}} ارسال شد. کد رهگیری: {{tracking_number}}', isActive: true },
];

export const SmsSettingsPage: React.FC = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    // در اینجا باید داده‌ها را از API بگیرید
    setTemplates(MOCK_TEMPLATES);
  }, []);

  const handleToggleChange = (id: string, isActive: boolean) => {
    // در اینجا باید تغییر را به سرور ارسال کنید
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive } : t));
    console.log(`Template ${id} active status changed to: ${isActive}`);
  };
  
  const handleEditClick = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };
  
  const handleSaveChanges = (updatedTemplate: NotificationTemplate) => {
    // در اینجا باید تغییر را به سرور ارسال کنید
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    console.log('Saved template:', updatedTemplate);
    setIsModalOpen(false);
    setEditingTemplate(null);
  };
  
  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
      <AdminPageHeader title="مدیریت اعلان‌های پیامکی" />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li className="mr-2">
                <button 
                    onClick={() => setActiveTab('settings')} 
                    className={`inline-block p-4 rounded-t-lg ${activeTab === 'settings' ? 'text-primary border-b-2 border-primary' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`}
                >
                    تنظیمات اعلان‌ها
                </button>
            </li>
            <li className="mr-2">
                <button 
                    onClick={() => setActiveTab('reports')} 
                    className={`inline-block p-4 rounded-t-lg ${activeTab === 'reports' ? 'text-primary border-b-2 border-primary' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`}
                >
                    گزارش ارسال
                </button>
            </li>
        </ul>
      </div>

      {/* SMS Credit Info */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex justify-between items-center">
              <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">اعتبار پیامک باقیمانده</h3>
                  <p className="text-2xl font-bold text-primary">1,245 <span className="text-sm font-normal text-gray-500 dark:text-gray-400">پیامک</span></p>
              </div>
              <button className="bg-primary hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <FaPlus /> خرید اعتبار جدید
              </button>
          </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">تنظیمات اعلان‌های سفارش</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">در این بخش می‌توانید پیامک‌های ارسالی در مراحل مختلف سفارش را مدیریت کنید.</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {templates.map(template => (
                  <NotificationSettingItem 
                      key={template.id} 
                      template={template} 
                      onToggle={handleToggleChange}
                      onEdit={handleEditClick}
                  />
              ))}
          </div>
      </div>

      {/* Edit Modal */}
      <EditTemplateModal
        isOpen={isModalOpen}
        template={editingTemplate}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChanges}
      />
    </div>
  );
};