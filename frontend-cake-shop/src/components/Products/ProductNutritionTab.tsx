// src/components/Products/ProductNutritionTab.tsx
import React from 'react';
import type { Cake } from '../../types';

interface Props {
  product: Cake | null;
}

const ProductNutritionTab: React.FC<Props> = ({ product }) => {
  if (!product) return null;

  return (
    <div> {/* حذف prose برای نمایش بهتر جدول */}
      <h3 className="font-bold text-lg mb-3 text-dark">ارزش غذایی</h3>
      {/* نمایش از فیلد nutrition_info_text */}
      {product.nutrition_info_text ? (
         // اگر متن شامل جدول HTML است:
         <div className="prose prose-sm max-w-none text-text-secondary" dangerouslySetInnerHTML={{ __html: product.nutrition_info_text }}></div>
         // اگر می‌خواهید جدول را با Tailwind بسازید:
         /* <div className="overflow-x-auto">
             <table className="w-full text-left text-text-secondary text-sm">
                 <tbody className="divide-y divide-gray-200">
                     <tr><td className="py-2 px-4">انرژی</td><td className="py-2 px-4 font-medium">۳۵۰ کالری</td></tr>
                     // ... بقیه ردیف‌ها ...
                 </tbody>
             </table>
            </div> */
      ) : (
        <p className="text-text-secondary">اطلاعات ارزش غذایی در دسترس نیست.</p>
      )}
    </div>
  );
};
export default ProductNutritionTab;