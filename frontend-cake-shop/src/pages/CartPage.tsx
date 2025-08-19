// src/pages/CartPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCart, getUserAddresses, updateOrderDetails, updateCartItemQuantity, removeCartItem, initiatePayment, updateOrderItemNote } from '../services/api';
import type { Order, Address } from '../types';

import CartItemCard from '../components/cart/CartItemCard';
import CartSummary from '../components/cart/CartSummary';
import EmptyCart from '../components/cart/EmptyCart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Alert } from '@mui/material';

function CartPage() {
  const { accessToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [cartData, setCartData] = useState<Order | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  // State برای بخش خلاصه سفارش
  const [selectedAddressId, setSelectedAddressId] = useState<number | ''>('');
  const [deliveryDateTime, setDeliveryDateTime] = useState<string>('');
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // تابع اصلی برای گرفتن تمام داده‌های لازم
  const loadPageData = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [cartResult, addressesResult] = await Promise.all([
        getCart(accessToken),
        getUserAddresses(accessToken)
      ]);
      setCartData(cartResult);
      setAddresses(addressesResult);
    } catch (err: any) {
      setError("خطایی در دریافت اطلاعات رخ داد.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, navigate]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItemId(itemId);
    try {
      const updatedCart = await updateCartItemQuantity(itemId, newQuantity, accessToken!);
      await loadPageData(); 
    } catch (err) {
      setError("خطا در به‌روزرسانی تعداد.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!window.confirm("آیا از حذف این محصول مطمئن هستید؟")) return;
    setUpdatingItemId(itemId);
    try {
      const updatedCart = await removeCartItem(itemId, accessToken!);
      await loadPageData();
    } catch (err) {
      setError("خطا در حذف محصول.");
    } finally {
      setUpdatingItemId(null);
    }
  };
  
  const handleSaveNote = async (itemId: number, note: string) => {
    setUpdatingItemId(itemId);
    try {
      await updateOrderItemNote(itemId, { notes: note }, accessToken!);
      // برای نمایش یادداشت جدید، کل سبد را دوباره می‌گیریم
      const updatedCart = await getCart(accessToken!);
      setCartData(updatedCart);
    } catch (err) {
      setError("خطا در ذخیره یادداشت.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleProceedToPayment = async () => {
    if (!cartData?.id || !selectedAddressId || !deliveryDateTime) {
      setCheckoutError("لطفاً آدرس و زمان تحویل را انتخاب کنید.");
      return;
    }
    setIsSubmittingCheckout(true);
    setCheckoutError(null);
    try {
      const updateData = {
        address_id: Number(selectedAddressId),
        delivery_datetime: deliveryDateTime
      };
      // ۱. ابتدا سفارش را با آدرس و زمان آپدیت می‌کنیم
      await updateOrderDetails(cartData.id, updateData, accessToken!);
      // ۲. سپس درخواست پرداخت را برای سفارش آپدیت شده ارسال می‌کنیم
      const paymentResponse = await initiatePayment(cartData.id, accessToken!);
      
      if (paymentResponse?.payment_url) {
        window.location.href = paymentResponse.payment_url;
      } else {
        throw new Error("پاسخی از درگاه پرداخت دریافت نشد.");
      }
    } catch (err: any) {
      setCheckoutError(err.response?.data?.detail || "خطایی در فرآیند پرداخت رخ داد.");
      setIsSubmittingCheckout(false);
    }
  };

  if (loading) return <LoadingSpinner text="در حال بارگذاری سبد خرید..." />;
  
  if (!cartData || cartData.items.length === 0) {
    return <EmptyCart />; // نمایش کامپوننت سبد خالی
  }
  
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">سبد خرید شما</h1>
      {error && <Alert severity="error" className="mb-6">{error}</Alert>}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 bg-white rounded-lg shadow-sm divide-y divide-gray-100">
          {cartData.items.map(item => (
            <CartItemCard
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveItem}
              onSaveNote={handleSaveNote}
              isUpdating={updatingItemId === item.id}
            />
          ))}
        </div>
        <div className="lg:w-1/3">
          <CartSummary 
            cart={cartData}
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onAddressChange={setSelectedAddressId}
            deliveryDateTime={deliveryDateTime}
            onDeliveryDateChange={setDeliveryDateTime}
            onProceedToPayment={handleProceedToPayment}
            isSubmitting={isSubmittingCheckout}
            error={checkoutError}
          />
        </div>
      </div>
    </main>
  );
}

export default CartPage;