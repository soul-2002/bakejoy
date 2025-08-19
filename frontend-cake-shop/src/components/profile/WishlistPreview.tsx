// src/components/profile/WishlistPreview.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import WishlistItemCard, { WishlistItemData } from './WishlistItemCard';

interface WishlistPreviewProps {
  items: WishlistItemData[]; // این prop یک آرایه است
  onRemoveItem: (itemId: number | string) => void;
  onAddItemToCart: (itemId: number | string) => void;
}

const WishlistPreview: React.FC<WishlistPreviewProps> = ({ items, onRemoveItem, onAddItemToCart }) => {
      console.log("WishlistPreview: Received 'items' prop with value:", items);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="title-font text-lg font-bold text-gray-800 dark:text-gray-100">علاقه‌مندی‌های اخیر</h3>
        <Link to="/profile/wishlist" className="text-amber-600 dark:text-amber-400 text-sm flex items-center space-x-1 rtl:space-x-reverse">
          <span>مشاهده همه</span>
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </Link>
      </div>
      
      {items && items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* VVVV --- اصلاح اصلی اینجاست --- VVVV */}
          {items.map(singleItem => (
            <WishlistItemCard 
              key={singleItem.id} 
              item={singleItem} // پاس دادن یک آبجکت تکی به prop 'item'
              onRemove={onRemoveItem} 
              onAddToCart={onAddItemToCart} 
            />
          ))}
          {/* ^^^^ -------------------------------- ^^^^ */}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>لیست علاقه‌مندی‌های شما خالی است.</p>
        </div>
      )}
    </div>
  );
};

export default WishlistPreview;