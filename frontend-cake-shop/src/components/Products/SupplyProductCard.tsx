import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'; // قلب توخالی
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons'; 
import type { PartySupply } from '../../types';
import { addToWishlist, removeFromWishlist } from '../../services/api'; // <-- API های شما
import { useAuth } from '../../contexts/AuthContext';
interface SupplyProductCardProps {
  product: PartySupply;
  onAddToCart: (productId: number, quantity: number) => void;
}

const SupplyProductCard: React.FC<SupplyProductCardProps> = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(product.is_wishlisted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasDiscount = product.sale_price && parseFloat(product.sale_price) < parseFloat(product.price);

  const { accessToken } = useAuth();
  const navigate = useNavigate();


  const handleAddToCartClick = () => {
    onAddToCart(product.id, quantity);
  };
  const handleWishlistToggle = async (event: React.MouseEvent) => {
    event.stopPropagation(); // جلوگیری از اجرای رویدادهای دیگر

    if (!accessToken) {
      navigate('/login');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    const originalStatus = isWishlisted;

    // آپدیت خوش‌بینانه: UI را بلافاصله تغییر می‌دهیم
    setIsWishlisted(!originalStatus);

    try {
      if (originalStatus) {
        // اگر بود، حذف کن
        await removeFromWishlist('supplies',product.slug, accessToken);
      } else {
        // اگر نبود، اضافه کن
        await addToWishlist('supplies',product.slug, accessToken);
      }
    } catch (error) {
      console.error("Failed to update wishlist", error);
      // در صورت خطا، UI را به حالت اولیه برمی‌گردانیم
      setIsWishlisted(originalStatus);
      alert("خطا در به‌روزرسانی علاقه‌مندی‌ها");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-card bg-white rounded-lg overflow-hidden shadow-sm transition-all duration-300 relative group">
      <div className="relative">
        <Link to={`/supplies/${product.slug}`}>
          <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
        </Link>
        {/* شما می‌توانید منطق تخفیف را بر اساس داده‌های محصول خود کامل کنید */}
        {hasDiscount && <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-semibold">تخفیف</div>}

        <button
          onClick={handleWishlistToggle}
          disabled={isSubmitting}
          className="absolute top-2 right-2 bg-white/80 p-2 rounded-full text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
          aria-label="افزودن به علاقه‌مندی‌ها"
        >
          <FontAwesomeIcon
            icon={isWishlisted ? faHeartSolid : faHeartRegular}
            className={isWishlisted ? 'text-red-500' : ''}
          />
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 mb-1 truncate hover:text-amber-600">
          <Link to={`/supplies/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="flex justify-between items-center mt-2 h-6">
          <div className="flex items-baseline">
            {hasDiscount ? (
              <>
                <span className="text-gray-400 line-through text-sm ml-2">{parseFloat(product.price).toLocaleString('fa-IR')}</span>
                <span className="font-bold text-lg text-amber-700">{parseFloat(product.sale_price).toLocaleString('fa-IR')}</span>
              </>
            ) : (
              <span className="font-bold text-lg text-amber-700">{parseFloat(product.price).toLocaleString('fa-IR')}</span>
            )}
            <span className="text-sm text-amber-700 mr-1">تومان</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center border border-gray-200 rounded-md">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-1 text-lg text-gray-600 hover:bg-gray-100">-</button>
            <span className="px-3 font-semibold text-gray-800">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-1 text-lg text-gray-600 hover:bg-gray-100">+</button>
          </div>
          <button onClick={handleAddToCartClick} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-md text-sm">
            افزودن
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplyProductCard;