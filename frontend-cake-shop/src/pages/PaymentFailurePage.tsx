import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faRedo, faCreditCard, faSpinner, faHeadset } from '@fortawesome/free-solid-svg-icons';

import { useAuth } from '../contexts/AuthContext';
import { getOrderById, retryPayment } from '../services/api';
import { Order } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

// کامپوننت کوچک برای راهکارهای پیشنهادی برای تمیزتر شدن کد
const SuggestedActionsList: React.FC = () => {
  const suggestions = [
    "اطلاعات کارت بانکی خود را بررسی کنید",
    "از کارت دیگری استفاده کنید یا موجودی را بررسی نمایید",
    "با بانک صادرکننده کارت خود تماس بگیرید",
  ];
  return (
    <div className="mb-8 text-right rtl">
      <h2 className="text-xl font-bold text-gray-800 mb-4">راهکارهای پیشنهادی</h2>
      <ul className="space-y-4 text-gray-700">
        {suggestions.map((text, index) => (
          <li key={index} className="flex items-start">
            <div className="bg-[#F59E0B] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 ml-3">
              <span>{index + 1}</span>
            </div>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};


const PaymentFailurePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>("متاسفانه در حال حاضر امکان پردازش پرداخت شما وجود ندارد. لطفاً دوباره تلاش کنید."); // پیام پیش‌فرض
  const [isRetrying, setIsRetrying] = useState(false);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId || !accessToken) {
      setError("اطلاعات سفارش برای نمایش یافت نشد.");
      setLoading(false);
      return;
    }
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        setOrder(await getOrderById(orderId, accessToken));
      } catch (err) {
        setError("خطا در دریافت اطلاعات سفارش.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrderData();
  }, [orderId, accessToken]);

  const handleRetry = async () => {
    if (!order) return;
    setIsRetrying(true);
    try {
      const { payment_url } = await retryPayment(order.id, accessToken!);
      window.location.href = payment_url;
    } catch (err) {
      setError("خطا در ایجاد لینک پرداخت جدید. لطفاً با پشتیبانی تماس بگیرید.");
      setIsRetrying(false);
    }
  };

  if (loading) return <LoadingSpinner text="در حال بارگذاری اطلاعات..." />;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 md:p-8">
          
          <div className="error-icon mb-6">
            <FontAwesomeIcon icon={faTimes} />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-4">
            پرداخت ناموفق بود
          </h1>
          
          {error && (
            <div className="error-message-box p-4 rounded-lg mb-6 rtl">
              <p className="text-gray-700 text-center">{error}</p>
            </div>
          )}
          
          <p className="text-lg text-center text-gray-600 mb-8">
            هیچ هزینه‌ای از حساب شما کسر نگردیده است. می‌توانید مجدداً برای تکمیل سفارش خود تلاش کنید.
          </p>
          
          {order && (
            <div className="order-summary p-4 md:p-6 mb-8 rtl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">خلاصه سفارش</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">شماره سفارش:</h3>
                  <p className="text-gray-800 font-medium font-mono">#{order.order_number}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">مبلغ قابل پرداخت:</h3>
                  <p className="text-gray-800 font-medium">{parseFloat(order.total_price).toLocaleString('fa-IR')} تومان</p>
                </div>
              </div>
            </div>
          )}
          
          <SuggestedActionsList />
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <button 
              onClick={handleRetry} 
              disabled={isRetrying || !order}
              className="btn-primary text-white font-semibold py-3 px-6 rounded-lg text-center flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRetrying ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faRedo} />}
              <span>{isRetrying ? 'در حال پردازش...' : 'تلاش مجدد'}</span>
            </button>
            <Link to="/cart" className="btn-outline font-semibold py-3 px-6 rounded-lg text-center">
              بازگشت به سبد خرید
            </Link>
          </div>

          <div className="mt-10 text-center">
            <div className="inline-flex items-center bg-blue-50 px-4 py-2 rounded-full">
              <FontAwesomeIcon icon={faHeadset} className="text-blue-500 ml-2" />
              <span className="text-gray-700">پشتیبانی: <a href="tel:+982112345678" className="text-blue-600 font-medium">۰۲۱-۱۲۳۴۵۶۷۸</a></span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;