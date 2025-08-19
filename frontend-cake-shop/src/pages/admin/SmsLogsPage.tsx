// src/pages/admin/SmsLogsPage.tsx

import React, { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/common/AdminPageHeader';
import { SmsLogTable } from '../../components/admin/sms/SmsLogTable';
import { SmsDetailsModal } from '../../components/admin/sms/SmsDetailsModal';
import { SmsLog } from '../../types'; // اینترفیس را تعریف کنید

// داده‌های نمونه
const MOCK_LOGS: SmsLog[] = [
    { id: 1, order_id: "1", sent_at: '2025-06-11T10:30:00Z', phone_number: '09123456789', content: 'سفارش شما با شماره #BAKE-1245 ثبت شد.', status: 'success' },
    { id: 2, order_id: "2", sent_at: '2025-06-11T11:00:00Z', phone_number: '09355555555', content: 'متأسفانه سفارش شما لغو گردید.', status: 'failed' },
    { id: 3, order_id: "3", sent_at: '2025-06-11T11:05:00Z', phone_number: '09121112233', content: 'سفارش شما در حال آماده‌سازی است.', status: 'pending' },
];

export const SmsLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<SmsLog[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<SmsLog | null>(null);

    useEffect(() => {
        // TODO: Fetch logs from API
        setLogs(MOCK_LOGS);
    }, []);

    const handleViewDetails = (log: SmsLog) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    const handleResend = (logId: number) => {
        // TODO: Call API to resend SMS
        alert(`درخواست ارسال مجدد برای پیامک با شناسه ${logId} ثبت شد.`);
    };

    return (
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
            <AdminPageHeader title="گزارش ارسال پیامک‌ها" />

            {/* TODO: Add SmsLogFilters component here */}

            {/* TODO: Add SmsStatsGrid component here */}

            <div className="mt-6">
                <SmsLogTable
                    logs={logs}
                    onViewDetails={handleViewDetails}
                    onResend={handleResend}
                />
            </div>

            <SmsDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                log={selectedLog}
            />
        </div>
    );
};