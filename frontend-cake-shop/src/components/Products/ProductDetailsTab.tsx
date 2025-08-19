// src/components/Products/ProductDetailsTab.tsx
import React from 'react';
import type { Cake } from '../../types'; // یا مسیر دیگر

interface Props {
  product: Cake | null;
}

const ProductDetailsTab: React.FC<Props> = ({ product }) => {
  if (!product) return null;

  // TODO: از فیلدهای بیشتری از product برای نمایش جزئیات استفاده کنید
  return (
    <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed">
      <h3 className="font-bold text-lg mb-3 text-dark not-prose">توضیحات کامل</h3>
      <p>{product.description ?? 'توضیحات کامل موجود نیست.'}</p>
      {/* مثال: نمایش ویژگی‌ها اگر در مدل اضافه شوند */}
      {/* {product.features && product.features.length > 0 && (
        <>
          <h4 className="font-semibold mt-4 mb-2 text-dark not-prose">ویژگی‌ها:</h4>
          <ul>
            {product.features.map((feature, index) => <li key={index}>{feature}</li>)}
          </ul>
        </>
      )} */}
      <ul>
        <li>تهیه شده با شکلات بلژیکی اصل</li>
        <li>فاقد مواد نگهدارنده</li>
        {/* ... سایر موارد از HTML ... */}
      </ul>
    </div>
  );
};

export default ProductDetailsTab;