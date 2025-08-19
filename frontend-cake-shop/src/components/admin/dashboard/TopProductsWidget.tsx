// src/components/admin/dashboard/TopProductsWidget.tsx
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getAdminTopProducts } from '../../../services/api';
import type { TopProductListItem } from '../../../types'; // تایپ محصول
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// آیکون‌های پیش‌فرض یا بر اساس دسته‌بندی
import { faBirthdayCake, faCookie, faIceCream, faBreadSlice, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { CircularProgress, Typography, Alert } from '@mui/material';

// تابعی برای گرفتن آیکون و رنگ بر اساس نام محصول یا دسته‌بندی (مثال ساده)
const getProductPresentation = (productName?: string, categoryName?: string): { icon: any, iconBgClass: string, iconColorClass: string } => {
  const name = (productName || categoryName || '').toLowerCase();
  if (name.includes('کیک') || name.includes('cake')) return { icon: faBirthdayCake, iconBgClass: 'bg-pink-100 dark:bg-pink-800', iconColorClass: 'text-pink-500 dark:text-pink-300' };
  if (name.includes('کوکی') || name.includes('cookie')) return { icon: faCookie, iconBgClass: 'bg-orange-100 dark:bg-orange-800', iconColorClass: 'text-orange-500 dark:text-orange-300' };
  if (name.includes('بستنی') || name.includes('ice cream')) return { icon: faIceCream, iconBgClass: 'bg-blue-100 dark:bg-blue-800', iconColorClass: 'text-blue-500 dark:text-blue-300' };
  if (name.includes('نان') || name.includes('bread')) return { icon: faBreadSlice, iconBgClass: 'bg-yellow-100 dark:bg-yellow-800', iconColorClass: 'text-yellow-500 dark:text-yellow-300' };
  return { icon: faQuestionCircle, iconBgClass: 'bg-gray-100 dark:bg-gray-600', iconColorClass: 'text-gray-500 dark:text-gray-300' }; // پیش‌فرض
};


interface TopProductsWidgetProps {
  count?: number;
  title?: string;
}

const TopProductsWidget: React.FC<TopProductsWidgetProps> = ({
  count = 4, // نمایش ۴ محصول برتر به طور پیش‌فرض
  title = "محصولات پرفروش"
}) => {
  const [products, setProducts] = useState<TopProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchTopProducts = async () => {
      if (!accessToken) {
        setError("توکن دسترسی ادمین موجود نیست.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminTopProducts(accessToken, count);
        setProducts(data);
      } catch (err: any) {
        setError(err.message || "خطا در بارگذاری محصولات پرفروش.");
        console.error("Error fetching top products for admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [accessToken, count]);

  return (
    <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 md:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-dark dark:text-white">{title}</h3>
        {/* لینک به صفحه گزارش محصولات یا لیست کامل محصولات */}
        <RouterLink
          to="/admin/products?sort=top-selling" // یا مسیر دیگر
          className="text-xs sm:text-sm text-primary hover:text-primary-dark dark:text-amber-400 dark:hover:text-amber-300 font-medium"
        >
          مشاهده همه
        </RouterLink>
      </div>

      {loading && (
        <div className="flex-grow flex items-center justify-center">
          <CircularProgress size={30} color="primary" />
          <Typography variant="body2" className="text-gray-500 dark:text-gray-400 mr-2">در حال بارگذاری...</Typography>
        </div>
      )}
      {error && !loading && (
         <div className="flex-grow flex items-center justify-center">
           <Alert severity="error" variant="outlined" className="w-full">{error}</Alert>
        </div>
      )}
      {!loading && !error && products.length === 0 && (
        <div className="flex-grow flex items-center justify-center">
          <Typography variant="body2" className="text-gray-500 dark:text-gray-400">محصول پرفروشی یافت نشد.</Typography>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="space-y-4 flex-grow">
          {products.map(product => {
            const presentation = getProductPresentation(product.name /*, product.category_name */);
            return (
              <div key={product.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-md ${presentation.iconBgClass} flex items-center justify-center flex-shrink-0`}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <FontAwesomeIcon icon={presentation.icon} className={`${presentation.iconColorClass} text-lg`} />
                  )}
                </div>
                <div className="mr-3 flex-grow min-w-0">
                  <p className="text-sm font-medium text-text-dark dark:text-gray-100 truncate" title={product.name}>
                    {product.name}
                  </p>
                  <p className="text-xs text-text-secondary dark:text-gray-400">
                    {product.base_price.toLocaleString('fa-IR')} فروش
                  </p>
                </div>
                {/* نمایش درآمد اگر در API بود (اختیاری)
                {product.total_revenue && (
                  <div className="text-sm font-medium text-text-dark dark:text-gray-200 flex-shrink-0 ml-2">
                    {Number(product.total_revenue).toLocaleString('fa-IR')} تومان
                  </div>
                )}
                */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopProductsWidget;