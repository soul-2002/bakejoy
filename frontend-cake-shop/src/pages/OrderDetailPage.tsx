// src/pages/OrderDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // useParams برای گرفتن پارامتر از URL
import { useAuth } from '../contexts/AuthContext';
import { getOrderById } from '../services/api';
// تایپ‌های لازم را از فایل types.ts ایمپورت کنید
import { Order, OrderItem, Transaction, Address, ProductMini, Flavor, Size } from '../types'; // مطمئن شوید همه تایپ‌ها یا معادلشان وجود دارند

// (اختیاری) می‌توانید تایپ کاملتری برای آیتم در جزئیات تعریف کنید اگر لازم است
interface OrderItemDetail extends OrderItem {
  // اگر ProductMini کافی نیست، می‌توانید فیلدهای بیشتری از Cake را اینجا بیاورید
  // cake: { id: number; name: string; image?: string | null; slug?: string; };
}

interface OrderDetail extends Order {
  // بازنویسی تایپ آیتم‌ها و تراکنش‌ها برای اطمینان از وجودشان
  items: OrderItemDetail[];
  transactions?: Transaction[];
  address?: Address | null; // استفاده از تایپ Address
}


const OrderDetailPage: React.FC = () => {
  // گرفتن orderId از پارامتر URL (مثلاً از /profile/orders/5 -> orderId = '5')
  const { orderId } = useParams<{ orderId: string }>();
  const { accessToken } = useAuth();

  const [orderDetails, setOrderDetails] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // پیدا کردن آخرین تراکنش موفق برای نمایش کد رهگیری
  const successfulTransaction = orderDetails?.transactions?.find(
    (t) => t.status === 'SUCCESS' && t.ref_id
  );

  useEffect(() => {
    // فقط اگر orderId و accessToken معتبر باشند
    if (orderId && accessToken) {
      setLoading(true);
      setError(null);
      console.log(`Workspaceing details for specific order ID: ${orderId}`);

      // فراخوانی API برای گرفتن جزئیات سفارش
      getOrderById(orderId, accessToken)
        .then(data => { // فرض: getOrderById خود دیتا (Order) را برمی‌گرداند
          console.log("Specific order details received:", data);
          setOrderDetails(data as OrderDetail); // Cast به تایپ دقیق‌تر
          setLoading(false);
        })
        .catch(err => {
          console.error(`Error fetching order ${orderId} details:`, err);
          if (err.response) {
             if (err.response.status === 401 || err.response.status === 403) {
               setError("شما اجازه دسترسی به این سفارش را ندارید یا نشست شما منقضی شده است.");
             } else if (err.response.status === 404) {
               setError("سفارش مورد نظر یافت نشد.");
             } else {
               setError(`خطا در دریافت اطلاعات سفارش (${err.response.status}).`);
             }
           } else if (err.request) {
              setError("پاسخی از سرور دریافت نشد.");
           } else {
             setError("خطا در ارسال درخواست.");
           }
          setLoading(false);
        });
    } else if (!orderId) {
      setError("شناسه سفارش نامعتبر است.");
      setLoading(false);
    } else if (!accessToken) {
      setError("برای مشاهده جزئیات سفارش، لطفاً ابتدا وارد شوید.");
      setLoading(false);
    }
  }, [orderId, accessToken]); // وابستگی به orderId و توکن

  // ---- بخش رندر کردن ----

  if (loading) {
    return <div>در حال بارگذاری جزئیات سفارش...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>خطا: {error}</div>;
  }

  if (!orderDetails) {
    return <div>اطلاعات سفارش یافت نشد.</div>;
  }

  // نمایش جزئیات سفارش
  return (
    <div>
      <h2>جزئیات سفارش #{orderDetails.id}</h2>
      <p><strong>وضعیت:</strong> {orderDetails.status_display || orderDetails.status}</p>
      <p><strong>تاریخ ثبت:</strong> {new Date(orderDetails.created_at ?? Date.now()).toLocaleDateString('fa-IR')}</p>
      <p><strong>مبلغ کل:</strong> {parseFloat(orderDetails.total_price).toLocaleString('fa-IR')} تومان</p>
      {/* نمایش کد رهگیری اگر پرداخت موفق بود */}
      {successfulTransaction?.ref_id && (
        <p><strong>کد رهگیری پرداخت:</strong> {successfulTransaction.ref_id}</p>
      )}

      <hr />

      {/* نمایش آدرس و زمان تحویل اگر وجود داشت */}
      <h3>اطلاعات تحویل</h3>
      {orderDetails.address ? (
        <div>
          <p><strong>استان:</strong> {orderDetails.address.province_name}</p>
          <p><strong>شهر:</strong> {orderDetails.address.city_name}</p>
          <p><strong>آدرس دقیق:</strong> {orderDetails.address.street_address}</p>
          <p><strong>کد پستی:</strong> {orderDetails.address.postal_code}</p>
        </div>
      ) : (
        <p>آدرس تحویل برای این سفارش ثبت نشده است.</p>
      )}
      {orderDetails.delivery_datetime_read ? ( // از فیلد خواندنی استفاده کنید
        <p><strong>زمان تحویل انتخاب شده:</strong> {new Date(orderDetails.delivery_datetime_read).toLocaleString('fa-IR')}</p>
      ) : (
         <p>زمان تحویل برای این سفارش ثبت نشده است.</p>
      )}
      {orderDetails.notes_read && ( // از فیلد خواندنی استفاده کنید
         <p><strong>یادداشت مشتری:</strong> {orderDetails.notes_read}</p>
      )}


      <hr />

      {/* نمایش آیتم‌های سفارش */}
      <h3>اقلام سفارش</h3>
      {orderDetails.items && orderDetails.items.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {orderDetails.items.map(item => (
            <li key={item.id} style={{ borderBottom: '1px solid #eee', marginBottom: '10px', paddingBottom: '10px' }}>
              {/* نمایش تصویر کوچک محصول اگر وجود دارد */}
              {item.cake?.image && <img src={item.cake.image} alt={item.cake.name} width="50" style={{ marginRight: '10px', verticalAlign: 'middle' }} />}
              <span>
                <strong>{item.cake?.name || 'محصول یافت نشد'}</strong>
                {item.flavor && ` - ${item.flavor.name}`}
                {item.size && ` - ${item.size.name}`}
              </span>
              <br />
              <span>تعداد: {item.quantity}</span> |
              <span> قیمت واحد (زمان سفارش): {parseFloat(item.price_at_order).toLocaleString('fa-IR')} تومان</span>
              {item.notes && <p style={{ fontSize: '0.9em', color: '#555' }}><em>یادداشت: {item.notes}</em></p>}
              {/* TODO: نمایش افزودنی‌ها (Addons) اگر لازم است */}
            </li>
          ))}
        </ul>
      ) : (
        <p>هیچ آیتمی در این سفارش وجود ندارد.</p>
      )}

      <hr />
      <Link to="/profile/orders">بازگشت به لیست سفارشات</Link>
    </div>
  );
};

export default OrderDetailPage;