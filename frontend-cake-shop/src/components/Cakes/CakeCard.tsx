// src/components/Cakes/CakeCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
// --- ایمپورت کردن اینترفیس Cake و شاید بقیه موارد لازم ---
// فرض می‌کنیم اینترفیس‌ها در src/types.ts تعریف شده‌اند
import type { Cake, Category, Flavor, Size } from '../../types';

interface CakeCardProps {
  cake: Cake; // <-- تغییر از CakeData به Cake
}

// مسیر تصویر پیش‌فرض در صورتی که عکس محصول null باشد
const DEFAULT_IMAGE_URL = '/images/default-cake.png'; // این فایل را در پوشه public/images قرار دهید

const CakeCard: React.FC<CakeCardProps> = ({ cake }) => {
  // استفاده از slug یا id برای لینک جزئیات
  const detailLink = `/products/${cake.slug ?? cake.id}`;

  return (
    // کلاس cake-card همچنان نیاز به تعریف CSS برای هاور دارد
    <div className="cake-card bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition duration-300 flex flex-col">
      <div className="relative overflow-hidden h-64">
        {/* --- استفاده از فیلد image و مدیریت null --- */}
        <img
          src={cake.image ?? DEFAULT_IMAGE_URL}
          alt={cake.name} // <-- استفاده از نام کیک برای alt
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
         {/* --- استفاده از فیلد name --- */}
        <h3 className="text-xl font-semibold font-heading mb-2 text-dark">{cake.name}</h3>
        {/* --- استفاده از فیلد description و مدیریت null --- */}
        <p className="text-text-secondary text-sm mb-4 flex-grow">{cake.short_description ?? ''}</p>
        <div className="flex justify-between items-center mt-auto">
           {/* --- استفاده از فیلد base_price (که رشته است) --- */}
           {/* واحد پول را می‌توانید اینجا یا با توجه به price_type اضافه کنید */}
          <span className="text-accent font-bold text-xl">${cake.base_price}</span>
          <Link
            to={detailLink}
            className="bg-primary text-white px-4 py-2 rounded-full text-sm font-body hover:bg-secondary transition"
          >
            مشاهده جزئیات
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CakeCard;