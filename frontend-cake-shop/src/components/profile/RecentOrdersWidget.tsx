import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import RecentOrderItem from './RecentOrderItem';
import { getUserOrders } from '../../services/api'; // تابع API برای گرفتن سفارشات
import type { Order } from '../../types';

const RecentOrdersWidget: React.FC = () => {
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentOrders = async () => {
            try {
                // فقط ۵ سفارش آخر را می‌گیریم
                const data = await getUserOrders({ limit: 5 });
                const ordersArray = data && Array.isArray(data.results) ? data.results : data;
               setRecentOrders(Array.isArray(ordersArray) ? ordersArray : []);
            } catch (error) {
                console.error("Failed to fetch recent orders:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecentOrders();
    }, []);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="title-font text-lg font-bold text-gray-800 dark:text-gray-100">سفارشات اخیر</h3>
                <Link to="/profile/orders" className="text-amber-600 dark:text-amber-400 text-sm font-medium flex items-center gap-1">
                    <span>مشاهده همه</span>
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 text-sm">
                            <th className="pb-3 px-2 sm:px-4 font-normal">شماره سفارش</th>
                            <th className="pb-3 px-2 sm:px-4 font-normal">تاریخ</th>
                            <th className="pb-3 px-2 sm:px-4 font-normal">مبلغ</th>
                            <th className="pb-3 px-2 sm:px-4 font-normal">وضعیت</th>
                            <th className="pb-3 px-2 sm:px-4 font-normal"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center p-4">در حال بارگذاری...</td></tr>
                        ) : recentOrders.length > 0 ? (
                            recentOrders.map(order => <RecentOrderItem key={order.id} order={order} />)
                        ) : (
                            <tr><td colSpan={5} className="text-center p-4">سفارش اخیری یافت نشد.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentOrdersWidget;