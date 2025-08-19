// src/components/WhyChooseUs/ValueCard.tsx
import React from 'react';
import type { ValueData } from '../../types'; // مسیر types را تنظیم کنید

interface ValueCardProps {
  value: ValueData;
}

const ValueCard: React.FC<ValueCardProps> = ({ value }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm text-center h-full"> {/* h-full برای ارتفاع یکسان در گرید */}
      {/* آیکون */}
      <div className="bg-light bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
        {/* آیکون SVG که به عنوان prop پاس داده شده */}
        {value.icon}
      </div>
      {/* عنوان */}
      <h3 className="text-xl font-semibold font-body mb-3 text-dark">{value.title}</h3> {/* font-body, text-dark */}
      {/* توضیحات */}
      <p className="text-text-secondary text-sm">{value.description}</p> {/* text-text-secondary */}
    </div>
  );
};

export default ValueCard;