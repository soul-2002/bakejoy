// src/pages/admin/sms/AdminSmsPanelPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

// توابع API (فرض می‌شود این توابع به درستی ایمپورت شده‌اند)
import { 
    getAdminSmsTemplates, 
    updateAdminSmsTemplate,
    getAdminSmsLogs,
    getAdminSmsStats 
} from '../../services/api';

import { SMSTemplate, SmsLog, SmsStats } from '../../types';
import AdminPageLayout from '../../components/admin/layout/AdminPageLayout';
import SmsCreditWidget from '../../components/admin/sms/SmsCreditWidget';
import SmsTemplateSettings from '../../components/admin/sms/SmsTemplateSettings';
import { SmsLogsContent } from '../../components/admin/sms/SmsLogsContent';
import {EditTemplateModal} from '../../components/admin/sms/EditTemplateModal';

const AdminSmsPanelPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings');
    
    // State های تب تنظیمات
    const [templates, setTemplates] = useState<SMSTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    
    // State های تب گزارش‌ها
    const [logs, setLogs] = useState<SmsLog[]>([]);
    const [stats, setStats] = useState<SmsStats | null>(null);
    const [loadingLogs, setLoadingLogs] = useState(true);

    // State های مشترک
    const [error, setError] = useState<string | null>(null);
    const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);

    const { accessToken } = useAuth();

    // --- واکشی داده‌های تب تنظیمات با منطق اصلاح شده ---
    const fetchTemplates = useCallback(async () => {
        if (!accessToken) return;
        setLoadingTemplates(true);
        setError(null);
        try {
            const data = await getAdminSmsTemplates(accessToken);

            console.log("داده خام دریافت شده از API قالب‌ها:", data);

            // --- منطق جدید برای پردازش انواع پاسخ API ---
            let templatesArray: SMSTemplate[] = [];
            if (data && Array.isArray(data.results)) {
                // حالت ۱: پاسخ صفحه‌بندی شده
                templatesArray = data.results;
            } else if (Array.isArray(data)) {
                // حالت ۲: پاسخ به صورت آرایه استاندارد
                templatesArray = data;
            } else if (typeof data === 'object' && data !== null) {
                // حالت ۳ (مشکل شما): پاسخ به صورت آبجکت شبه‌آرایه
                // ما مقادیر آبجکت را به یک آرایه تبدیل می‌کنیم
                templatesArray = Object.values(data).filter(
                    (item): item is SMSTemplate => typeof item === 'object' && item.id
                );
            }

            setTemplates(templatesArray);

        } catch (err: any) {
            const errorMessage = "خطا در دریافت قالب‌های پیامک.";
            setError(errorMessage);
            console.error(errorMessage, err.response?.data || err.message);
        } finally {
            setLoadingTemplates(false);
        }
    }, [accessToken]);

    const fetchLogsAndStats = useCallback(async () => {
        if (!accessToken) return;
        setLoadingLogs(true);
        setError(null);
        try {
            const [logsData, statsData] = await Promise.all([
                getAdminSmsLogs(accessToken),
                getAdminSmsStats(accessToken)
            ]);
            console.log("داده خام دریافت شده از API گزارش‌ها (Logs):", logsData);
            console.log("داده خام دریافت شده از API آمار (Stats):", statsData);
            
            setLogs(logsData.results || (Array.isArray(logsData) ? logsData : []));
            setStats(statsData);
        } catch (err: any) {
            setError("خطا در دریافت گزارش‌های پیامک.");
            console.error("Error fetching SMS logs/stats:", err);
        } finally {
            setLoadingLogs(false);
        }
    }, [accessToken]);


    useEffect(() => {
        if (activeTab === 'settings') {
            fetchTemplates();
        } else if (activeTab === 'logs') {
            fetchLogsAndStats();
        }
    }, [activeTab, fetchTemplates, fetchLogsAndStats]);

    const handleEditClick = (template: SMSTemplate) => {
        setSelectedTemplate(template);
        setIsEditorModalOpen(true);
    };

    const handleToggleActive = async (templateId: number | string, newStatus: boolean) => {
        if (!accessToken) return;
        
        const originalTemplates = [...templates];
        const updatedTemplates = templates.map(t => t.id === templateId ? { ...t, is_active: newStatus } : t);
        setTemplates(updatedTemplates);

        try {
            await updateAdminSmsTemplate(accessToken, templateId, { is_active: newStatus });
        } catch (err) {
            alert("خطا در به‌روزرسانی وضعیت. بازگرداندن به حالت قبل.");
            setTemplates(originalTemplates);
            console.error("Failed to toggle template status:", err);
        }
    };
    
    const handleModalSave = async (updatedTemplate: SMSTemplate) => {
        if (!accessToken || !selectedTemplate) return;
        
        try {
            // --- تغییر کلیدی اینجاست ---
            // ما از selectedTemplate.event_trigger به عنوان شناسه استفاده می‌کنیم
            // و فقط فیلدهایی که قابل ویرایش هستند را در پی‌لود قرار می‌دهیم.
            await updateAdminSmsTemplate(
                accessToken, 
                selectedTemplate.event_trigger, // ارسال شناسه متنی به جای عددی
                { message_template: updatedTemplate.message_template } // ارسال فیلد صحیح
            );
            
            alert("قالب با موفقیت ذخیره شد.");
            setIsEditorModalOpen(false);
            // fetchTemplates(); // واکشی مجدد برای نمایش آخرین تغییرات
        } catch (err) {
            alert("خطا در ذخیره قالب.");
            console.error("Failed to save template:", err);
        }
    };

    return (
        <AdminPageLayout pageTitle="مدیریت اعلان‌های پیامکی">
            <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
                <nav className="-mb-px flex space-x-4 rtl:space-x-reverse" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'settings' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        تنظیمات اعلان‌ها
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none transition-colors ${activeTab === 'logs' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        گزارش ارسال پیامک‌ها
                    </button>
                </nav>
            </div>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert"><p>{error}</p></div>}

            {activeTab === 'settings' && (
                <>
                    <SmsCreditWidget />
                    <SmsTemplateSettings
                        templates={templates}
                        onToggleActive={handleToggleActive}
                        onEditClick={handleEditClick}
                        loading={loadingTemplates}
                    />
                </>
            )}

            {activeTab === 'logs' && (
                <SmsLogsContent 
                    logs={logs}
                    stats={stats}
                    loading={loadingLogs}
                />
            )}

            {isEditorModalOpen && selectedTemplate && (
                <EditTemplateModal
                    isOpen={isEditorModalOpen}
                    onClose={() => setIsEditorModalOpen(false)}
                    template={selectedTemplate}
                    onSave={handleModalSave}
                />
            )}
        </AdminPageLayout>
    );
};

export default AdminSmsPanelPage;
