// src/components/profile/WishlistItemCard.tsx
import React, { useState } from 'react'; // useState اضافه شد
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// faHeartSolid برای نمایش قلب توپر و قرمز اضافه شد
import { faHeart as faHeartSolid, faEye } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext'; // برای دسترسی به توکن
import { removeFromWishlist } from '../../services/api'; // تابع API برای حذف

// اینترفیس‌ها بدون تغییر باقی می‌مانند
interface ProductData {
  id: number | string;
  name: string;
  slug: string;
  image: string;
  base_price: string;
}

export interface WishlistItemData {
  id: number | string;
  product: ProductData;
}

interface WishlistItemCardProps {
  item: WishlistItemData;
  onRemove: (itemId: number | string) => void;
}

const WishlistItemCard: React.FC<WishlistItemCardProps> = ({ item, onRemove }) => {
  const { product } = item;
  const { accessToken } = useAuth(); // دسترسی به توکن کاربر
  const [isSubmitting, setIsSubmitting] = useState(false); // State برای مدیریت وضعیت ارسال درخواست

  if (!product) {
    return null;
  }
  
  const wishlistItemId = item.id;

  // تابع جدید برای مدیریت حذف از لیست علاقه‌مندی‌ها
  const handleRemoveClick = async () => {
    if (isSubmitting) return; // جلوگیری از کلیک‌های متعدد
    if (!accessToken) {
      alert("برای حذف آیتم، لطفاً از حساب کاربری خود اطمینan حاصل کنید.");
      return;
    }

    setIsSubmitting(true); // شروع عملیات

    try {
      // ارسال درخواست حذف به API با استفاده از اسلاگ محصول
      await removeFromWishlist('cakes',accessToken, product.slug);
      
      // در صورت موفقیت، تابع onRemove را صدا بزن تا آیتم از UI حذف شود
      onRemove(wishlistItemId);

    } catch (error) {
      console.error("Failed to remove item from wishlist:", error);
      alert("خطایی در حذف محصول از لیست علاقه‌مندی‌ها رخ داد.");
    } finally {
      setIsSubmitting(false); // پایان عملیات
    }
  };

  // بخش فرمت قیمت بدون تغییر
  const priceAsNumber = parseFloat(product.base_price);
  const priceInToman = priceAsNumber / 10;
  const formattedPrice = priceInToman.toLocaleString('fa-IR');

  return (
    <div className="wishlist-item bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="relative">
        <Link to={`/products/${product.slug}`}>
          <img src={product.image} alt={product.name} className="w-full h-32 object-cover" />
        </Link>
        
        {/* دکمه حذف به‌روز شده */}
        <button
          onClick={handleRemoveClick}
          disabled={isSubmitting} // دکمه در حین عملیات غیرفعال می‌شود
          title="حذف از علاقه‌مندی‌ها"
          className="absolute top-2 left-2 rtl:right-2 rtl:left-auto bg-white/80 backdrop-blur-sm p-2 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faHeartSolid} />
        </button>

      </div>
      <div className="p-3">
        <Link to={`/products/${product.slug}`}>
          <h4 className="font-medium text-sm mb-1 text-gray-800 dark:text-gray-100 hover:text-amber-600 truncate" title={product.name}>
            {product.name}
          </h4>
        </Link>
        <p className="text-amber-600 dark:text-amber-400 font-bold text-sm mb-2">
          {formattedPrice} تومان
        </p>
        <Link
          to={`/products/${product.slug}`}
          className="mt-2 w-full bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faEye} className="ml-2 rtl:mr-2" />
          مشاهده جزئیات
        </Link>
      </div>
    </div>
  );
};

export default WishlistItemCard;