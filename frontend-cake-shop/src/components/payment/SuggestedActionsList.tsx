import React from 'react';

const suggestions = [
  "اطلاعات کارت بانکی خود را بررسی کنید (تاریخ انقضا، CVV2)",
  "از کارت دیگری استفاده کنید یا موجودی حساب خود را بررسی نمایید",
  "با بانک صادرکننده کارت خود تماس بگیرید",
];

const SuggestedActionsList: React.FC = () => {
  return (
    <div className="mb-8 text-right">
      <h2 className="text-xl font-bold text-gray-800 mb-4">راهکارهای پیشنهادی</h2>
      <ul className="space-y-4 text-gray-700">
        {suggestions.map((text, index) => (
          <li key={index} className="flex items-start">
            <div className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 ml-3">
              <span>{index + 1}</span>
            </div>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SuggestedActionsList;