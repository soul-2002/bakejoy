// src/components/Products/ProductCard.tsx
import React, { useState } from 'react'; // useState برای دکمه Wishlist
import { Link } from 'react-router-dom';
import type { Cake } from '../../types'; // یا مسیر دیگر
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons'; // ستاره پر
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'; // قلب توخالی
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons'; // قلب توپر
import { useAuth } from '../../contexts/AuthContext'; // برای دسترسی به توکن
import { addToWishlist, removeFromWishlist } from '../../services/api'; // توابع API

interface ProductCardProps {
  cake: Cake;
  onWishlistChange?: (productId: number | string, isWishlisted: boolean) => void;

  // می‌توان تابعی برای مدیریت افزودن/حذف از علاقه‌مندی‌ها از بیرون پاس داد
  // onToggleWishlist?: (cakeId: number) => void;
}

const DEFAULT_IMAGE_URL = '/images/default-cake.png'; // تصویر پیش‌فرض

// کامپوننت کوچک برای نمایش ستاره‌ها
const RatingStars: React.FC<{ rating?: number | null }> = ({ rating }) => {
  const numRating = rating ?? 0;
  const fullStars = Math.floor(numRating);
  // برای سادگی فقط ستاره های پر را نمایش می‌دهیم (می‌توانید ستاره خالی یا نیمه هم اضافه کنید)
  if (numRating <= 0) return null; // اگر امتیازی نیست، چیزی نشان نده

  return (
    <div className="flex items-center space-x-1 space-x-reverse text-yellow-400">
      {[...Array(fullStars)].map((_, i) => (
        <FontAwesomeIcon icon={faStarSolid} key={i} className="w-4 h-4" />
      ))}
      <span className="text-gray-600 text-sm ml-1">{numRating.toFixed(1)}</span>
    </div>
  );
};


const ProductCard: React.FC<ProductCardProps> = ({ cake, onWishlistChange }) => {
  const detailLink = `/products/${cake.slug ?? cake.id}`;
  const { accessToken } = useAuth();

  // State داخلی موقت برای دکمه علاقه‌مندی (در حالت واقعی از Context یا Prop می‌آید)
  const [isWishlisted, setIsWishlisted] = useState(cake.is_wishlisted ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false); // برای جلوگیری از کلیک‌های متعدد

  const handleWishlistClick = async(event: React.MouseEvent) => {
    event.preventDefault(); // جلوگیری از رفتن به لینک صفحه محصول
    if (!accessToken) {
      alert("برای افزودن به علاقه‌مندی‌ها، لطفاً ابتدا وارد شوید.");
      // یا navigate('/login');
      return;
    }
    if (isSubmitting) return; // اگر درخواست قبلی در حال انجام است، کاری نکن

    setIsSubmitting(true);
    const originalWishlistStatus = isWishlisted;
    
    // آپدیت خوش‌بینانه: بلافاصله UI را تغییر بده
    setIsWishlisted(!originalWishlistStatus);

    try {
      if (originalWishlistStatus) {
        // اگر از قبل در لیست بود، حذف کن
        await removeFromWishlist('cakes',accessToken, cake.slug);
      } else {
        // اگر نبود، اضافه کن
        await addToWishlist('cakes',accessToken, cake.slug);
      }
      // اگر تابع onWishlistChange از والد پاس داده شده بود، آن را صدا بزن
      if (onWishlistChange) {
        onWishlistChange(cake.id, !originalWishlistStatus);
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
      // اگر API با خطا مواجه شد، UI را به حالت قبل برگردان
      setIsWishlisted(originalWishlistStatus);
      alert("خطا در به‌روزرسانی لیست علاقه‌مندی‌ها.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const priceAsNumber = parseFloat(cake.base_price);
  const priceInToman = priceAsNumber / 10;
  const formattedPrice = priceInToman.toLocaleString('fa-IR');

  // تعیین رنگ تگ دسته‌بندی (مثال ساده)
  let categoryColorClass = 'bg-primary'; // پیش‌فرض
  if (cake.category?.slug === 'wedding') categoryColorClass = 'bg-secondary';
  if (cake.category?.slug === 'special') categoryColorClass = 'bg-accent';
  // ... می‌توانید رنگ‌های بیشتری تعریف کنید ...

  return (
    // کلاس product-card می‌تواند استایل هاور را از CSS بگیرد
    <div className="product-card bg-white rounded-2xl shadow-md overflow-hidden transition duration-300 hover:shadow-lg h-full flex flex-col">
      <div className="relative flex-shrink-0">
        <img
          src={cake.image ?? DEFAULT_IMAGE_URL}
          alt={cake.name}
          className="w-full h-48 object-cover" // ارتفاع ثابت برای عکس
        />
        {/* تگ دسته‌بندی روی عکس */}
        {cake.category && (
          // موقعیت تگ با absolute پایین و راست (در RTL)
          <span className={`absolute top-3 left-3 bg-secondary text-white text-xs px-3 py-1 rounded-full ${categoryColorClass}`}>
            {cake.category.name}
          </span>
        )}
        {/* دکمه علاقه‌مندی روی عکس */}
        <div className="absolute top-2 right-2"> {/* یا top-2 left-2 برای RTL */}
          <button
            onClick={handleWishlistClick}
            className={`p-2 rounded-full bg-white/80 backdrop-blur-sm transition ${isWishlisted ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'}`}
            aria-label="افزودن به علاقه‌مندی‌ها"
          >
            <FontAwesomeIcon icon={isWishlisted ? faHeartSolid : faHeartRegular} className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* محتوای کارت */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-dark font-body">{cake.name}</h3>
          {/* نمایش امتیاز */}
          <RatingStars rating={cake.rating} />
        </div>
        <p className="text-text-secondary text-sm mb-3 flex-grow">{cake.description ?? ''}</p>
        <div className="flex justify-between items-center mt-auto">
          {/* نمایش قیمت */}
          <span className="font-bold text-primary">{formattedPrice} تومان</span> {/* فرمت فارسی قیمت */}
          {/* دکمه مشاهده جزئیات */}
          <Link
            to={detailLink}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition text-sm font-body"
          >
            مشاهده جزئیات
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;