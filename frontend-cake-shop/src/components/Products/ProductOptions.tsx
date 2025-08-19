// src/components/Products/ProductOptions.tsx
import React from 'react';
// تایپ‌های SizeVariant و Flavor را از فایل types خود ایمپورت کنید
import type { ProductSizeVariant, Flavor } from '../../types';

interface ProductOptionsProps {
  sizes: ProductSizeVariant[]; // <--- تغییر از Size[] به SizeVariant[]
  selectedSizeId: number | ''; // این ID خود SizeVariant است، نه ID اندازه
  onSizeChange: (sizeVariantId: number) => void; // این تابع ID خود SizeVariant را برمی‌گرداند

  flavors: Flavor[];
  selectedFlavorId: number | '';
  onFlavorChange: (flavorId: number) => void;
  
  disabled?: boolean;
}

const ProductOptions: React.FC<ProductOptionsProps> = ({
  sizes, selectedSizeId, onSizeChange,
  flavors, selectedFlavorId, onFlavorChange,
  disabled = false
}) => {
  // کلاس‌های استایل بدون تغییر باقی می‌مانند
  const baseButtonClass = "px-4 py-2 border rounded-lg transition text-sm disabled:opacity-50";
  const defaultButtonClass = "border-gray-300 text-gray-700 dark:text-gray-200 hover:border-amber-500 dark:hover:border-amber-400";
  const selectedButtonClass = "border-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-400 dark:text-amber-300 ring-1 ring-amber-500";

  return (
    <>
      {/* انتخاب اندازه */}
      {sizes && sizes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-100">انتخاب اندازه</h3>
          <div className="flex flex-wrap gap-3">
            {sizes.map(variant => ( // <--- نام متغیر را به variant تغییر می‌دهیم برای خوانایی بهتر
              <button
                key={variant.id} // کلید باید ID خود variant باشد
                type="button"
                onClick={() => onSizeChange(variant.id)} // ID خود variant را پاس می‌دهیم
                disabled={disabled}
                className={`${baseButtonClass} ${selectedSizeId === variant.id ? selectedButtonClass : defaultButtonClass}`}
              >
                {variant.size.name} {/* <--- اصلاح کلیدی: خواندن نام از آبجکت تودرتوی size */}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* انتخاب طعم (این بخش به نظر می‌رسد از قبل صحیح بوده) */}
      {flavors && flavors.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-100">انتخاب طعم</h3>
          <div className="flex flex-wrap gap-3">
             {flavors.map(flavor => (
                <button
                  key={flavor.id}
                  type="button"
                  onClick={() => onFlavorChange(flavor.id)}
                  disabled={disabled}
                  className={`${baseButtonClass} ${selectedFlavorId === flavor.id ? selectedButtonClass : defaultButtonClass}`}
                >
                  {flavor.name}
                </button>
             ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductOptions;