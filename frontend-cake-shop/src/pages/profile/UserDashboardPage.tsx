// src/pages/profile/UserDashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingBag, faUserEdit, faMapMarkerAlt, faHeart, faChevronLeft, faGift
} from '@fortawesome/free-solid-svg-icons';
import WishlistPreview from '../../components/profile/WishlistPreview'; // ایمپورت کامپوننت جدید
import { getUserOrders, getUserWishlist } from '../../services/api';
import { Order, Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import WelcomeBanner from '../../components/profile/WelcomeBanner';
import RecentOrdersWidget from '../../components/profile/RecentOrdersWidget';



// کامپوننت کوچک برای نمایش یک ردیف سفارش


const UserDashboardPage: React.FC = () => {

  const { user, accessToken } = useAuth();
  const quickActions = [
    { label: 'پیگیری سفارش', icon: faShoppingBag, to: '/profile/orders' },
    { label: 'ویرایش پروفایل', icon: faUserEdit, to: '/profile/edit-info' },
    { label: 'مدیریت آدرس‌ها', icon: faMapMarkerAlt, to: '/profile/addresses' },
    { label: 'لیست علاقه‌ها', icon: faHeart, to: '/profile/wishlist' },
  ];
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // واکشی همزمان ۳ سفارش اخیر و ۴ آیتم اخیر علاقه‌مندی‌ها
      const [ordersResponse, wishlistResponse] = await Promise.all([
        getUserOrders(accessToken, { limit: 3, ordering: '-created_at' }),
        getUserWishlist(accessToken, { limit: 4 }).catch(e => { console.error("Could not fetch wishlist:", e); return null; })]);

      // پردازش پاسخ سفارشات
      if (ordersResponse && 'results' in ordersResponse) {
        setRecentOrders(ordersResponse.results);
      } else if (Array.isArray(ordersResponse)) {
        setRecentOrders(ordersResponse);
      }

      // پردازش پاسخ علاقه‌مندی‌ها
      if (wishlistResponse && 'results' in wishlistResponse) {
        setWishlistItems(wishlistResponse.results);
      } else if (Array.isArray(wishlistResponse)) {
        setWishlistItems(wishlistResponse);
      }

    } catch (err: any) {
      setError("خطا در دریافت اطلاعات داشبورد.");
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // توابع handler برای علاقه‌مندی‌ها
  const handleRemoveFromWishlist = (itemId: number | string) => {
    alert(`آیتم ${itemId} از علاقه‌مندی‌ها حذف شد`);
  };
  const handleAddToCartFromWishlist = (itemId: number | string) => {
    // TODO: فراخوانی API برای افزودن به سبد خرید
    alert(`آیتم ${itemId} (فعلاً شبیه‌سازی شده) به سبد خرید اضافه شد.`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="title-font text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">پیشخوان</h2>

       {user && <WelcomeBanner user={user} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {quickActions.map(action => (
          <Link key={action.label} to={action.to} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-3">
              <FontAwesomeIcon icon={action.icon} className="text-amber-600 dark:text-amber-400 text-xl" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
          </Link>
        ))}
      </div>

      <RecentOrdersWidget />

      <WishlistPreview
        items={wishlistItems}
        onRemoveItem={handleRemoveFromWishlist}
        onAddItemToCart={handleAddToCartFromWishlist}
      />
    </div>
  );
};

export default UserDashboardPage;