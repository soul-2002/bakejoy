// src/components/Products/ProductGallery.tsx
import React, { useState, useEffect } from 'react';
import type { ProductImage } from '../../types'; // مطمئن شوید این تایپ را دارید: { id: number; image: string; image_thumbnail?: string | null }

interface ProductGalleryProps {
  mainImageUrl?: string | null;
  thumbnails: ProductImage[]; // آرایه‌ای از تصاویر گالری که از API می‌آید
  altText: string;
}

const DEFAULT_IMAGE_URL = '/images/default-cake.png'; // مسیر تصویر پیش‌فرض

const ProductGallery: React.FC<ProductGalleryProps> = ({ mainImageUrl, thumbnails = [], altText }) => {
  const [activeImage, setActiveImage] = useState(mainImageUrl || DEFAULT_IMAGE_URL);

  useEffect(() => {
    // اگر تصویر اصلی از props تغییر کرد (مثلاً کاربر به محصول دیگری رفت)، تصویر فعال را آپدیت کن
    setActiveImage(mainImageUrl || DEFAULT_IMAGE_URL);
  }, [mainImageUrl]);

  // ایجاد لیست کامل تصاویر برای نمایش در thumbnail ها (شامل تصویر اصلی)
  // با استفاده از Set برای جلوگیری از نمایش تکراری تصویر اصلی در thumbnail ها
  const uniqueThumbnailUrls = new Set(thumbnails.map(t => t.image));
  const displayThumbnails = mainImageUrl && !uniqueThumbnailUrls.has(mainImageUrl)
    ? [{ id: 'main', image: mainImageUrl, image_thumbnail: mainImageUrl }, ...thumbnails]
    : thumbnails;

  return (
    <div className="flex flex-col gap-4">
      {/* نمایشگر تصویر اصلی */}
      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-slate-600">
        <img
          src={activeImage}
          alt={altText}
          className="w-full h-80 md:h-96 object-cover" // <--- اعمال کلاس‌های درخواستی شما
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE_URL; }} // Fallback در صورت خطا در بارگذاری تصویر
        />
      </div>

      {/* نمایشگر Thumbnail ها (فقط اگر بیش از یک تصویر وجود دارد) */}
      {displayThumbnails.length > 0 && ( // نمایش حتی اگر فقط یک تصویر گالری باشد
        <div className="flex justify-center flex-wrap gap-3">
          {mainImageUrl && ( // نمایش تصویر اصلی به عنوان اولین thumbnail
             <button
                key="main-thumb"
                onClick={() => setActiveImage(mainImageUrl)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                  ${activeImage === mainImageUrl ? 'border-amber-500' : 'border-transparent hover:border-gray-400'}`
                }
             >
                <img src={mainImageUrl} alt={`${altText} - اصلی`} className="w-full h-full object-cover" />
             </button>
          )}

          {thumbnails.map((thumb) => ( // نمایش بقیه تصاویر گالری
            <button
              key={thumb.id}
              onClick={() => setActiveImage(thumb.image)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                ${activeImage === thumb.image ? 'border-amber-500' : 'border-transparent hover:border-gray-400'}`
              }
            >
              <img
                src={thumb.image_thumbnail || thumb.image} // استفاده از thumbnail اگر وجود دارد
                alt={altText}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;