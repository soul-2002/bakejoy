// src/components/Products/ProductIngredientsTab.tsx
import React from 'react';
import type { Cake } from '../../types';

interface Props {
  product: Cake | null;
}

const ProductIngredientsTab: React.FC<Props> = ({ product }) => {
  if (!product) return null;

  return (
    <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed">
      <h3 className="font-bold text-lg mb-3 text-dark not-prose">مواد تشکیل دهنده</h3>
      {/* نمایش از فیلد ingredients_text (اگر در مدل و اینترفیس Cake اضافه شده) */}
      {product.ingredients_text ? (
         <div dangerouslySetInnerHTML={{ __html: product.ingredients_text }} /> // اگر متن شامل HTML است
         // <p>{product.ingredients_text}</p> // اگر متن ساده است
      ) : (
        <p>لیست مواد تشکیل دهنده در دسترس نیست.</p>
        // یا نمایش لیست ثابت از HTML شما:
        // <ul><li>آرد گندم</li><li>شکر</li>...</ul>
      )}

      {/* نمایش آلرژن‌ها از فیلد allergen_info_text */}
      {product.allergen_info_text && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 text-red-600 prose-p:my-1 prose-h4:my-1 text-sm">
          <h4 className="font-bold mb-1 not-prose">مواد آلرژی‌زا:</h4>
          <p>{product.allergen_info_text}</p>
        </div>
      )}
    </div>
  );
};
export default ProductIngredientsTab;