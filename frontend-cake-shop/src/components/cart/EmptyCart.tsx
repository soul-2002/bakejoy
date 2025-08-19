import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';

const EmptyCart: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center text-center py-12 bg-white rounded-xl shadow-sm">
        <div className="mb-8">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faShoppingCart} className="text-amber-500 text-4xl" />
            </div>
        </div>
        
        <div className="max-w-md mx-auto">
          <h1 className="font-bold text-3xl md:text-4xl text-gray-800 mb-4">سبد خرید شما خالی است!</h1>
          <p className="text-gray-600 text-lg mb-8">
            به نظر می‌رسد هنوز هیچ محصول خوشمزه‌ای به سبد خریدتان اضافه نکرده‌اید.
          </p>
          
          <RouterLink
            to="/products" // یا /supplies
            className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            شروع خرید
          </RouterLink>
        </div>
      </div>
    </main>
  );
};

export default EmptyCart;