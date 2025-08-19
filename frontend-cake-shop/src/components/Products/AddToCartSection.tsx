// src/components/Products/AddToCartSection.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { Button as MuiButton, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext'; // برای دسترسی به توکن
import { addToWishlist, removeFromWishlist } from '../../services/api'; // توابع API

interface AddToCartSectionProps {
  isAuthenticated: boolean;
  isSubmitting: boolean; // وضعیت دکمه "افزودن به سبد"
  initialIsWishlisted: boolean; // وضعیت اولیه علاقه‌مندی از بیرون پاس داده می‌شود
  productSlug: string; // اسلاگ محصول برای ارسال به API
  onAddToCart: () => void; // تابع اصلی افزودن به سبد
  onWishlistChange?: (newStatus: boolean) => void; // تابعی برای اطلاع به والد (اختیاری)
}

const AddToCartSection: React.FC<AddToCartSectionProps> = ({
  isAuthenticated,
  isSubmitting,
  initialIsWishlisted,
  productSlug,
  onAddToCart,
  onWishlistChange,
}) => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  // State داخلی برای مدیریت وضعیت علاقه‌مندی و لودینگ آن
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isWishlistSubmitting, setIsWishlistSubmitting] = useState(false);

  // --- تابع اصلی برای مدیریت افزودن/حذف از علاقه‌مندی‌ها ---
  const handleToggleWishlist = async () => {
    if (!isAuthenticated || !accessToken) {
      alert("برای افزودن به علاقه‌مندی‌ها، لطفاً ابتدا وارد شوید.");
      navigate('/login');
      return;
    }
    if (isWishlistSubmitting) return; // جلوگیری از کلیک‌های تکراری

    setIsWishlistSubmitting(true);
    const originalStatus = isWishlisted; // وضعیت فعلی را ذخیره کن

    // 1. آپدیت خوش‌بینانه: UI را بلافاصله تغییر بده
    setIsWishlisted(!originalStatus);

    try {
      // 2. ارسال درخواست به API
      if (originalStatus) {
        // اگر در لیست بود، حذف کن
        await removeFromWishlist('cakes',accessToken, productSlug);
      } else {
        // اگر نبود، اضافه کن
        await addToWishlist('cakes',accessToken, productSlug);
      }
      // 3. به کامپوننت والد اطلاع بده (در صورت وجود)
      if (onWishlistChange) {
        onWishlistChange(!originalStatus);
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
      alert("خطا در به‌روزرسانی لیست علاقه‌مندی‌ها.");
      // 4. در صورت خطا، UI را به حالت قبل برگردان
      setIsWishlisted(originalStatus);
    } finally {
      // 5. در هر صورت، وضعیت لودینگ را غیرفعال کن
      setIsWishlistSubmitting(false);
    }
  };


  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {isAuthenticated ? (
        <button
          type="button"
          onClick={onAddToCart}
          disabled={isSubmitting || isWishlistSubmitting} // در هر دو حالت لودینگ غیرفعال شود
          className={`add-to-cart-btn bg-primary hover:bg-secondary text-white px-6 py-3 rounded-lg font-medium transition flex-grow flex items-center justify-center gap-2 font-body ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
             <FontAwesomeIcon icon={faShoppingCart} />
          )}
          <span>{isSubmitting ? 'درحال افزودن...' : 'افزودن به سبد خرید'}</span>
        </button>
      ) : (
        <Alert severity="warning" className="w-full">
            برای افزودن به سبد خرید، لطفاً <MuiButton color="inherit" size="small" onClick={() => navigate('/login')}>وارد شوید</MuiButton>.
        </Alert>
      )}

      {/* دکمه علاقه‌مندی */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={isSubmitting || isWishlistSubmitting} // در هر دو حالت لودینگ غیرفعال شود
          className="wishlist-btn p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="افزودن به علاقه‌مندی‌ها"
        >
          {isWishlistSubmitting ? (
              // نمایش لودینگ برای دکمه علاقه‌مندی
             <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
            <FontAwesomeIcon
              icon={isWishlisted ? faHeartSolid : faHeartRegular}
              className={`w-5 h-5 transition-colors ${isWishlisted ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            />
          )}
        </button>
      )}
    </div>
  );
};

export default AddToCartSection;