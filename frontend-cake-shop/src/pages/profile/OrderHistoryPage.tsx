import React, { useState, useEffect } from 'react';
import RecentOrderItem from '../../components/profile/RecentOrderItem'; // <-- استفاده مجدد از کامپوننت ردیف
import { getUserOrders } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Order } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

const PAGE_SIZE = 10;

const OrderHistoryPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!accessToken) return;

      setLoading(true);
      setError(null);
      try {
        const params = { page, page_size: PAGE_SIZE };
        const data = await getUserOrders(accessToken,params );
        
        const ordersData = data && Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
        const totalCount = data && typeof data.count === 'number' ? data.count : ordersData.length;

        setOrders(ordersData);
        setTotalOrders(totalCount);

      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("خطایی در دریافت سفارشات رخ داد.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, accessToken]);

  const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

  const renderContent = () => {
    if (loading) {
      return <tr><td colSpan={5} className="text-center p-8"><LoadingSpinner /></td></tr>;
    }
    if (error) {
      return <tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>;
    }
    if (orders.length === 0) {
      return <tr><td colSpan={5} className="text-center p-8 text-gray-500">شما تاکنون هیچ سفارشی ثبت نکرده‌اید.</td></tr>;
    }
    // در اینجا از کامپوننت RecentOrderItem استفاده مجدد می‌کنیم
    return orders.map(order => <RecentOrderItem key={order.id} order={order} />);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">تاریخچه سفارشات</h1>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 text-sm">
                  <th className="p-4 font-normal">شماره سفارش</th>
                  <th className="p-4 font-normal">تاریخ</th>
                  <th className="p-4 font-normal">مبلغ</th>
                  <th className="p-4 font-normal">وضعیت</th>
                  <th className="p-4 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {renderContent()}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-slate-700">
              <button 
                onClick={() => page > 1 && setPage(page - 1)} 
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faChevronRight} />
                قبلی
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                صفحه {page} از {totalPages}
              </span>
              <button 
                onClick={() => page < totalPages && setPage(page + 1)} 
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                بعدی
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;