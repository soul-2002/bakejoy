// src/pages/PaymentSuccessPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faShoppingBag, faHome, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

// کامپوننت‌های فرزند را ایمپورت می‌کنیم
import OrderSummary from '../components/payment/OrderSummary';
import CollapsibleOrderItems from '../components/payment/CollapsibleOrderItems';
import DeliveryInformation from '../components/payment/DeliveryInformation';
import NextSteps from '../components/payment/NextSteps';

// توابع و تایپ‌های لازم
import { useAuth } from '../contexts/AuthContext';
import { getOrderById } from '../services/api'; // فرض بر اینکه تابعی برای گرفتن جزئیات سفارش دارید
import { Order } from '../types';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { accessToken } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // از query param در URL برای گرفتن شناسه سفارش استفاده می‌کنیم
const orderId = searchParams.get('orderId');
  const transactionId = searchParams.get('transaction_id'); // ممکن است از این هم برای تایید استفاده کنید

  useEffect(() => {
    if (!orderId || !accessToken) {
      setError("اطلاعات سفارش برای نمایش یافت نشد.");
      setLoading(false);
      return;
    }

    const fetchOrderData = async () => {
      try {
        setLoading(true);
        // TODO: در بک‌اند، باید یک view برای تایید نهایی پرداخت بر اساس transactionId داشته باشید
        // و سپس جزئیات سفارش تایید شده را برگردانید.
        const orderData = await getOrderById(orderId, accessToken);
        setOrder(orderData);
      } catch (err: any) {
        setError("خطا در دریافت اطلاعات سفارش: " + (err.message || "خطای ناشناخته"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, accessToken]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-amber-500" />
        <p className="mt-4 text-gray-600">در حال بارگذاری اطلاعات سفارش...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
          <p className="font-bold">خطا</p>
          <p>{error || "سفارش مورد نظر یافت نشد."}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full mx-auto flex items-center justify-center border-4 border-green-200 dark:border-green-500/30">
            <FontAwesomeIcon icon={faCheck} className="text-green-500 text-4xl" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
          سفارش شما با موفقیت ثبت شد!
        </h1>

        <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-8">
          از اعتماد شما به BAKEJÖY سپاسگزاریم. سفارش شما در حال آماده‌سازی است.
        </p>

        <OrderSummary order={order} />
        <DeliveryInformation address={order.address} deliveryTime={order.delivery_datetime_read} />
        <CollapsibleOrderItems items={order.items || []} />
        <NextSteps />

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Link to={`/profile/orders/${order.id}`} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors">
            <FontAwesomeIcon icon={faShoppingBag} className="ml-2 rtl:mr-2" />
            مشاهده سفارش
          </Link>
          <Link to="/" className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg text-center transition-colors">
            <FontAwesomeIcon icon={faHome} className="ml-2 rtl:mr-2" />
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;

