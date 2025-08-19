// src/components/admin/sms/SmsLogsContent.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { FaPaperPlane, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaRedo } from 'react-icons/fa';
// --- ۱. اصلاح اینترفیس‌ها برای مطابقت با API ---
import { SmsLog as SmsLogType, SmsStats, SmsStatus as SmsStatusType } from '../../../types';

//================================================================
// 1. TYPE DEFINITIONS & SUB-COMPONENTS
//================================================================

// اینترفیس با نام فیلدهای صحیح مطابق با پاسخ API
// این بخش را می‌توانید در فایل types/index.ts خود به‌روز کنید
export type SmsStatus = 'SENT' | 'FAILED' | 'PENDING';

export interface SmsLog {
  id: number;
  order: number; // یا order_info
  user_info: {
    id: number;
    username: string;
    full_name: string;
    phone_number?: string;
  };
  sent_at: string;
  message: string; // <-- نام صحیح برای محتوای پیامک
  status: SmsStatus;
  status_display: string;
}

interface LogFilters {
  dateRange: string;
  startDate?: string;
  endDate?: string;
  status: 'all' | SmsStatus;
  orderId: string;
  phone: string;
}

// --- کامپوننت کپسول وضعیت (با کلیدهای صحیح) ---
const statusMap: Record<SmsStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  SENT: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300', icon: <FaCheckCircle className="ml-1" />, label: 'ارسال موفق' },
  FAILED: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300', icon: <FaTimesCircle className="ml-1" />, label: 'ناموفق' },
  PENDING: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', icon: <FaClock className="ml-1" />, label: 'در انتظار' },
};
const StatusBadge: React.FC<{ status: SmsStatus }> = ({ status }) => {
  const styles = statusMap[status] || statusMap.PENDING;
  return <span className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${styles.bg} ${styles.text}`}>{styles.icon}{styles.label}</span>;
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: number; colorClasses: string }> = ({ icon, title, value, colorClasses }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center">
            <div className={`p-3 rounded-full ${colorClasses} ml-4`}>{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">{value.toLocaleString('fa-IR')}</p>
            </div>
        </div>
    </div>
);

// --- کامپوننت فیلترها ---
const SmsLogFilters: React.FC<{ onApplyFilters: (data: Partial<LogFilters>) => void; }> = ({ onApplyFilters }) => {
    const { register, handleSubmit, reset } = useForm<LogFilters>({
        defaultValues: {
            dateRange: "last30",
            status: "all",
            orderId: "",
            phone: ""
        }
    });

    const handleClearFilters = () => {
        reset();
        onApplyFilters({});
    }

    return (
        <form onSubmit={handleSubmit(onApplyFilters)} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">فیلترها</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">بازه زمانی</label>
                    <select {...register("dateRange")} className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
                        <option value="last7">7 روز گذشته</option>
                        <option value="last30">30 روز گذشته</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
                    <select {...register("status")} className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
                        <option value="all">همه</option>
                        <option value="SENT">ارسال موفق</option>
                        <option value="FAILED">ارسال ناموفق</option>
                        <option value="PENDING">در انتظار</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره تلفن</label>
                    <input
                        type="text"
                        id="phone"
                        {...register("phone")}
                        placeholder="مثال: 0912..."
                        className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
            </div>
            <div className="flex justify-end mt-4 gap-x-3">
                <button type="button" onClick={handleClearFilters} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">پاک کردن</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-yellow-600 text-white rounded-md shadow-sm text-sm font-medium">اعمال فیلتر</button>
            </div>
      </form>
    );
};


//================================================================
// 2. MAIN COMPONENT
//================================================================

interface SmsLogsContentProps {
  logs: SmsLog[];
  stats: SmsStats | null;
  loading: boolean;
  onFiltersChange: (filters: Partial<LogFilters>) => void;
  onResend: (logId: number) => void;
  onViewDetails: (log: SmsLog) => void;
}

export const SmsLogsContent: React.FC<SmsLogsContentProps> = ({
  logs,
  stats,
  loading,
  onFiltersChange,
  onResend,
  onViewDetails,
}) => {
  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={5} className="text-center p-10 text-gray-500">
            در حال بارگذاری گزارش‌ها...
          </td>
        </tr>
      );
    }
    if (!logs || logs.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="text-center p-10 text-gray-500">
            هیچ گزارشی با فیلترهای اعمال شده یافت نشد.
          </td>
        </tr>
      );
    }
    return logs.map((log) => (
      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(log.sent_at).toLocaleString('fa-IR')}</td>
        {/* --- نمایش شماره تلفن از آبجکت user_info --- */}
        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700 dark:text-gray-200">{log.user_info?.phone_number || log.user_info?.username || 'ناشناس'}</td>
        {/* --- نمایش محتوا از فیلد message --- */}
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200 max-w-xs truncate" title={log.message}>{log.message}</td>
        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={log.status} /></td>
        {/* --- اصلاح شده: تغییر فاصله و اندازه آیکون --- */}
        <td className="px-6 py-4 whitespace-nowrap text-lg">
          <div className="flex items-center gap-x-6">
            <button onClick={() => onViewDetails(log)} className="text-gray-400 hover:text-primary transition-colors">
              <FaEye />
            </button>
            <button onClick={() => onResend(log.id)} className="text-gray-400 hover:text-green-500 transition-colors">
              <FaRedo className="text-base" /> {/* text-base آیکون را کمی کوچک‌تر می‌کند */}
            </button>
          </div>
        </td>
      </tr>
    ));
  };


  return (
    <div className="space-y-6">
      <SmsLogFilters onApplyFilters={onFiltersChange} />
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<FaPaperPlane />} title="کل پیامک‌ها" value={stats.total} colorClasses="bg-amber-100 text-amber-600" />
          <StatCard icon={<FaCheckCircle />} title="ارسال موفق" value={stats.successful} colorClasses="bg-green-100 text-green-600" />
          <StatCard icon={<FaTimesCircle />} title="ارسال ناموفق" value={stats.failed} colorClasses="bg-red-100 text-red-600" />
          <StatCard icon={<FaClock />} title="در حال ارسال" value={stats.pending} colorClasses="bg-blue-100 text-blue-600" />
        </div>
      )}
      
      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">گیرنده</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">متن</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
