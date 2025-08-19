// src/components/admin/dashboard/SalesChartWidget.tsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // برای پر کردن زیر نمودار خطی (اختیاری)
} from 'chart.js';
import { useAuth } from '../../../contexts/AuthContext';
import { getAdminSalesChartData } from '../../../services/api';
import type { SalesChartDataItem } from '../../../types';
import { CircularProgress, Typography, Alert, Tabs, Tab, Box } from '@mui/material'; // برای تب‌ها و ...

// رجیستر کردن کامپوننت‌های Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type PeriodValue = '7d' | '30d' | 'this_month'; // اضافه کردن گزینه‌های بیشتر

const SalesChartWidget: React.FC = () => {
  const [chartData, setChartData] = useState<SalesChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodValue>('7d');
  const { accessToken } = useAuth();
  const { isDarkMode } = useAuth(); // فرض وجود isDarkMode در AuthContext برای تنظیم رنگ نمودار

  useEffect(() => {
    const fetchChartData = async () => {
      if (!accessToken) {
        setError("توکن دسترسی ادمین موجود نیست.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminSalesChartData(accessToken, selectedPeriod);
        setChartData(data);
      } catch (err: any) {
        setError(err.message || "خطا در بارگذاری داده‌های نمودار فروش.");
        console.error("Error fetching sales chart data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [accessToken, selectedPeriod]);

  const handlePeriodChange = (event: React.SyntheticEvent, newValue: PeriodValue) => {
    setSelectedPeriod(newValue);
  };

  const dataForChart = {
    labels: chartData.map(item =>
      new Date(item.date).toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' })
    ), // برچسب‌های محور X (تاریخ‌ها)
    datasets: [
      {
        label: 'مجموع فروش (تومان)',
        data: chartData.map(item => item.total_sales / 10),
        fill: true, // پر کردن فضای زیر نمودار
        borderColor: isDarkMode ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)', // amber-400 / amber-600
        backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.2)',
        tension: 0.3, // انحنای خط
        pointBackgroundColor: isDarkMode ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: isDarkMode ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)',
      },
    ],
  };

  const optionsForChart = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#4b5563', // gray-200 / gray-600
          font: { family: 'Vazirmatn, sans-serif' }
        }
      },
      title: {
        display: false, // عنوان اصلی ویجت کافی است
        // text: 'نمودار فروش',
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', // gray-700 / white
        titleColor: isDarkMode ? '#f3f4f6' : '#1f2937', // gray-100 / gray-800
        bodyColor: isDarkMode ? '#d1d5db' : '#374151', // gray-300 / gray-700
        borderColor: isDarkMode ? '#4b5563' : '#e5e7eb', // gray-600 / gray-200
        borderWidth: 1,
        titleFont: { family: 'Vazirmatn, sans-serif' },
        bodyFont: { family: 'Vazirmatn, sans-serif' },
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(context.parsed.y * 10).replace('ریال', 'تومان');
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // یا color: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.7)', // gray-600 / gray-200
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280', // gray-400 / gray-500
          font: { family: 'Vazirmatn, sans-serif', size: 10 }
        },
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)', // gray-600 / gray-200
          borderDash: [2, 4],
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280', // gray-400 / gray-500
          font: { family: 'Vazirmatn, sans-serif', size: 10 },
          callback: function (value: any, index: any, ticks: any) {
            const numericValue = Number(value);
            if (numericValue === 0) return '۰'; // نمایش صفر به جای خالی یا K ۰
            if (numericValue >= 1000000) { // میلیون
              return (numericValue / 1000000).toLocaleString('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + ' M';
            }
            if (numericValue >= 1000) { // هزار
              return (numericValue / 1000).toLocaleString('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' K';
            }
            return numericValue.toLocaleString('fa-IR');
          }
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-dark dark:text-white mb-2 sm:mb-0">
          نمودار فروش
        </h3>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', alignSelf: 'flex-start' }}>
          <Tabs
            value={selectedPeriod}
            onChange={handlePeriodChange}
            aria-label="بازه زمانی نمودار فروش"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: '36px', // ارتفاع کمتر برای تب‌ها
              '& .MuiTab-root': {
                minHeight: '36px',
                fontSize: '0.75rem', // فونت کوچکتر برای تب‌ها
                padding: '6px 12px',
                color: isDarkMode ? 'text.secondary' : 'text.primary', // رنگ متن تب‌ها
                '&.Mui-selected': {
                  color: 'primary.main', // رنگ متن تب انتخاب شده (amber)
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main', // رنگ indicator (amber)
              },
            }}
          >
            <Tab label="۷ روز اخیر" value="7d" />
            <Tab label="۳۰ روز اخیر" value="30d" />
            {/* <Tab label="ماه جاری" value="this_month" /> */}
            {/* می‌توانید گزینه‌های بیشتری اضافه کنید */}
          </Tabs>
        </Box>
      </div>

      <div className="flex-grow" style={{ minHeight: '250px', maxHeight: '350px' }}> {/* ارتفاع مشخص برای نمودار */}
        {loading && (
          <div className="flex items-center justify-center h-full">
            <CircularProgress /> <Typography className="mr-2 dark:text-gray-300">در حال بارگذاری نمودار...</Typography>
          </div>
        )}
        {error && !loading && (
          <div className="flex items-center justify-center h-full">
            <Alert severity="error" variant="outlined" className="w-full">{error}</Alert>
          </div>
        )}
        {!loading && !error && chartData.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <Typography className="text-gray-500 dark:text-gray-400">داده‌ای برای نمایش در نمودار فروش وجود ندارد.</Typography>
          </div>
        )}
        {!loading && !error && chartData.length > 0 && (
          <Line options={optionsForChart as any} data={dataForChart} />
        )}
      </div>
    </div>
  );
};

export default SalesChartWidget;