// src/pages/profile/UserOrderDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faRedo, faMapMarkedAlt, faCommentAlt, faPhoneAlt, faBox, faTruck, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

import type { Order } from '../../types'; // <<-- ایمپورت از فایل اصلی تایپ‌ها
import { getOrderById } from '../../services/api'; // <<-- ایمپورت تابع API
import { useAuth } from '../../contexts/AuthContext'; // برای دسترسی به توکن

import OrderStatusBadge from '../../components/profile/OrderStatusBadge'; // کامپوننت‌های فرزند
import OrderItemRow from '../../components/profile/OrderItemRow';
import LoadingSpinner from '../../components/common/LoadingSpinner'; // یک کامپوننت لودینگ
import Alert from '@mui/material/Alert'; // برای نمایش خطا
import StatusTimeline from '../../components/profile/StatusTimeline';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import OrderStatusCard from '../../components/profile/OrderStatusCard';
import { useNavigate } from 'react-router-dom';
import { reorder } from '../../services/api'

const UserOrderDetailPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const { accessToken } = useAuth();
    const navigate = useNavigate(); // برای هدایت کاربر

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [isReordering, setIsReordering] = useState(false); // State برای لودینگ دکمه سفارش مجدد
    const handlePrint = () => {
        window.print();
    };

    const handleReorder = async () => {
        if (!order || !accessToken) return;

        setIsReordering(true);
        try {
            await reorder(order.id, accessToken);
            alert('محصولات این سفارش به سبد خرید شما اضافه شد.');
            navigate('/cart'); // هدایت کاربر به صفحه سبد خرید
        } catch (reorderError) {
            alert('خطایی در ثبت سفارش مجدد رخ داد.');
            console.error(reorderError);
        } finally {
            setIsReordering(false);
        }
    };
    useEffect(() => {
        if (!orderId || !accessToken) {
            setError("اطلاعات مورد نیاز برای دریافت سفارش موجود نیست.");
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                setLoading(true);
                const data = await getOrderById(orderId, accessToken);
                setOrder(data);
            } catch (err) {
                setError("خطایی در دریافت اطلاعات سفارش رخ داد. لطفاً دوباره تلاش کنید.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, accessToken]);

    const formatPrice = (price: string | number) => {
        const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
        return `${numericPrice.toLocaleString('fa-IR')} تومان`;
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <Alert severity="error" className="m-8">{error}</Alert>;
    }

    if (!order) {
        return <Alert severity="info" className="m-8">سفارش مورد نظر یافت نشد.</Alert>;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">جزئیات سفارش {order.order_number}</h1>
                    <div className="mt-2 md:mt-0 flex gap-2">
                        <button onClick={handlePrint} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2">
                            <FontAwesomeIcon icon={faPrint} />
                            چاپ
                        </button>
                        <button onClick={handleReorder}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                            <FontAwesomeIcon icon={faRedo} />
                            سفارش مجدد
                        </button>
                    </div>
                </div>

                <OrderStatusCard order={order} />


                {/* Order Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">اطلاعات سفارش</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">شماره سفارش:</span>
                                <span className="font-medium">#{order.order_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">تاریخ ثبت:</span>
                                <span className="font-medium">{new Date(order.created_at!).toLocaleDateString('fa-IR')}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">روش پرداخت:</span>
                                {/* این فیلد ممکن است در آبجکت تراکنش باشد، آن را مطابق با API خود تنظیم کنید */}
                                <span className="font-medium">{order.transactions?.[0]?.payment_method_display || 'نامشخص'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">روش ارسال:</span>
                                {/* این فیلد را باید مطابق با API خود تنظیم کنید */}
                                <span className="font-medium">{order.shipping_method || 'نامشخص'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">اطلاعات تحویل</h3>
                        {order.address ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-gray-600 mb-1">تحویل گیرنده:</p>
                                    {/* نام گیرنده از آبجکت user خوانده می‌شود */}
                                    <p className="font-medium">{`${order.user.first_name} ${order.user.last_name}`}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 mb-1">آدرس:</p>
                                    {/* آدرس از آبجکت address خوانده می‌شود */}
                                    <p className="font-medium leading-relaxed">{`${order.address.city_name}, ${order.address.street}`}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 mb-1">شماره تماس:</p>
                                    {/* شماره تماس از آبجکت user خوانده می‌شود */}
                                    <p className="font-medium">{order.user.phone_number}</p>
                                </div>
                                <div><p className="text-gray-600 mb-1">زمان تحویل:</p><p className="font-medium">{new Date(order.delivery_datetime_read).toLocaleString('fa-IR') || 'نامشخص'}</p></div>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">آدرس تحویل برای این سفارش ثبت نشده است.</p>
                        )}
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">یادداشت سفارش</h3>
                        {order.notes ? (
                            <p className="text-gray-700 leading-relaxed">{order.notes}</p>
                        ) : (
                            <p className="text-gray-500 italic">یادداشتی ثبت نشده است.</p>
                        )}
                    </div>

                </div>

                {/* Order Items Table */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">محصولات سفارش</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-600 text-sm">
                                    <th className="pb-3 text-right">محصول</th>
                                    <th className="pb-3 text-center">قیمت واحد</th>
                                    <th className="pb-3 text-center">تعداد</th>
                                    <th className="pb-3 text-left">جمع</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map(item => <OrderItemRow key={item.id} item={item} />)}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals & Support */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">خلاصه سفارش</h3>
                        <div className="space-y-3">
                            {/* ... بخش جمع مبالغ ... */}
                            <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
                                <span className="text-gray-800 font-bold">مبلغ نهایی:</span>
                                <span className="text-lg font-bold text-amber-600">{formatPrice(order.total_price)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">نیاز به کمک دارید؟</h3>
                        <p className="text-gray-700 mb-4">اگر در مورد سفارش خود سوالی دارید یا مشکلی وجود دارد، می‌توانید از طریق راه‌های زیر با ما در تماس باشید:</p>
                        <div className="space-y-3">
                            <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium text-right flex items-center gap-2">
                                <FontAwesomeIcon icon={faCommentAlt} />
                                چت آنلاین
                            </button>
                            <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium text-right flex items-center gap-2">
                                <FontAwesomeIcon icon={faPhoneAlt} />
                                تماس با پشتیبانی
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserOrderDetailPage;