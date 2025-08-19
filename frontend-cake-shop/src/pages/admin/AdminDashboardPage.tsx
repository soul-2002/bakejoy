// src/pages/admin/AdminDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminDashboardStats } from '../../services/api';
import { AdminDashboardStats as AdminDashboardStatsType } from '../../types'; // تغییر نام برای جلوگیری از تداخل
import { Link as RouterLink } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/common/AdminPageHeader';
import StatCard from '../../components/admin/dashboard/StatCard';
import RecentOrdersWidget from '../../components/admin/dashboard/RecentOrdersWidget';
import TopProductsWidget from '../../components/admin/dashboard/TopProductsWidget';
import QuickActionsWidget from '../../components/admin/dashboard/QuickActionsWidget';
import AlertsWidget from '../../components/admin/dashboard/AlertsWidget';
import SalesChartWidget from '../../components/admin/dashboard/SalesChartWidget';

// ایمپورت آیکون‌های لازم از FontAwesome
import {
  faWallet,
  faShoppingCart,
  faChartBar,
  faUserPlus,
  faChartLine, // برای نمودار فروش
  faBirthdayCake, // برای محصولات پرفروش

} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// TODO: کامپوننت‌های ویجت‌های دیگر (SalesChartWidget, TopProductsWidget, RecentOrdersWidget, QuickActionsWidget, AlertsWidget)
// باید در مراحل بعدی ایجاد شوند. فعلاً از placeholder استفاده می‌کنیم.

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    if (accessToken) {
      setLoading(true);
      setError(null);
      getAdminDashboardStats(accessToken)
        .then(data => {
          setStats(data);
        })
        .catch(err => {
          console.error("Error fetching dashboard stats:", err);
          setError(err.response?.data?.detail || err.message || "خطا در دریافت آمار داشبورد.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError("نیاز به ورود به عنوان ادمین.");
      setLoading(false);
    }
  }, [accessToken]);

  const formatNumber = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '۰';
    const numStr = typeof num === 'number' ? num.toString() : num;
    const integerPart = parseFloat(numStr).toFixed(0);
    return parseInt(integerPart, 10).toLocaleString('fa-IR');
  };

  // داده‌های نمونه برای بخش‌های دیگر (اینها باید از API بیایند)
  const topProductsExample = [
    { id: 1, name: 'کیک شکلاتی ویژه', sales: 28, revenue: '۴,۲۵۰,۰۰۰ تومان', icon: faBirthdayCake, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { id: 2, name: 'کوکی‌های خانگی', sales: 19, revenue: '۳,۷۵۰,۰۰۰ تومان', icon: 'cookie' as any, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' }, // آیکون کوکی در free-solid نیست، باید اضافه شود یا جایگزین
    { id: 3, name: 'بستنی وانیلی', sales: 15, revenue: '۳,۲۰۰,۰۰۰ تومان', icon: 'ice-cream' as any, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 4, name: 'کاپ کیک میوه‌ای', sales: 12, revenue: '۲,۹۰۰,۰۰۰ تومان', icon: 'stroopwafel' as any, iconBg: 'bg-green-100', iconColor: 'text-green-600' }, // آیکون کاپ کیک در free-solid نیست
  ];



  return (
    // این کامپوننت داخل <AdminLayout> و <Outlet/> آن رندر می‌شود
    <>
      <AdminPageHeader title="پیشخوان مدیریت" />

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">خطا</p>
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="درآمد امروز"
          value={formatNumber(stats?.today_revenue)}
          unit="تومان"
          icon={faWallet}
          iconBgColor="bg-amber-100 dark:bg-amber-800"
          iconTextColor="text-amber-600 dark:text-amber-300"
          percentageChange={12} // داده نمونه
          changePeriod="نسبت به دیروز"
          loading={loading && !stats}
        />
        <StatCard
          title="سفارشات امروز"
          value={formatNumber(stats?.processing_orders_count)} // فرض کنید این تعداد سفارشات امروز است، باید از API بیاید
          unit="سفارش"
          icon={faShoppingCart}
          iconBgColor="bg-blue-100 dark:bg-blue-800"
          iconTextColor="text-blue-600 dark:text-blue-300"
          percentageChange={8} // داده نمونه
          changePeriod="نسبت به دیروز"
          loading={loading && !stats}
        />
        <StatCard
          title="میانگین سفارش" // این باید از API محاسبه و ارسال شود
          value={formatNumber(stats?.average_order_value)} // فرض بر وجود این فیلد در AdminDashboardStatsType
          unit="تومان"
          icon={faChartBar}
          iconBgColor="bg-purple-100 dark:bg-purple-800"
          iconTextColor="text-purple-600 dark:text-purple-300"
          percentageChange={-3} // داده نمونه
          changePeriod="نسبت به دیروز"
          loading={loading && !stats}
        />
        <StatCard
          title="مشتریان جدید (امروز)" // این باید از API بیاید
          value={formatNumber(stats?.new_users_today_count)} // فرض بر وجود این فیلد
          unit="نفر"
          icon={faUserPlus}
          iconBgColor="bg-green-100 dark:bg-green-800"
          iconTextColor="text-green-600 dark:text-green-300"
          percentageChange={40} // داده نمونه
          changePeriod="نسبت به دیروز"
          loading={loading && !stats}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Chart */}
 
          <SalesChartWidget />
          
        <TopProductsWidget count={4} />
      </div>

      {/* Recent Orders & Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2"> {/* این div به RecentOrdersWidget منتقل شده */}
                <RecentOrdersWidget count={5} />
              </div>

        {/* Quick Actions & Alerts Column */}
        <div className="space-y-6">
        <QuickActionsWidget />
        <AlertsWidget />
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;