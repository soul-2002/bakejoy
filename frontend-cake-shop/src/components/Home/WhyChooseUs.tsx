// src/components/Home/WhyChooseUs.tsx
import React from 'react';
import ValueCard from '../WhyChooseUs/ValueCard'; // ایمپورت کارت - مسیر را چک کنید
import type { ValueData } from '../../types'; // مسیر types را تنظیم کنید

// تعریف داده‌ها و آیکون‌های SVG به صورت JSX
// (می‌توانید آیکون‌ها را به صورت کامپوننت جدا هم ایمپورت کنید اگر از ابزاری مثل SVGR استفاده می‌کنید)
const valuesData: ValueData[] = [
  {
    id: 1,
    title: "مواد اولیه درجه یک", // Premium Ingredients
    description: "ما فقط بهترین و تازه‌ترین مواد اولیه را برای طعم و کیفیت استثنایی استفاده می‌کنیم.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "طرح‌های سفارشی", // Custom Designs
    description: "کیک خود را شخصی‌سازی کنید تا کاملاً با تم رویداد یا مناسبت خاص شما مطابقت داشته باشد.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "تحویل به‌موقع", // On-Time Delivery
    description: "ما کیک شما را تازه و به‌موقع، درست زمانی که به آن نیاز دارید، تحویل می‌دهیم.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "قیمت‌های منصفانه", // Fair Prices
    description: "کیفیت استثنایی با قیمت‌هایی که به اندازه مناسبت شما، بودجه شما را هم جشن می‌گیرد!",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];


const WhyChooseUs: React.FC = () => {
  return (
    // استفاده از رنگ bg-light شما
    <section className="py-16 bg-light">
      <div className="container mx-auto px-6">
        {/* عنوان و توضیحات */}
        <div className="text-center mb-12 md:mb-16">
           {/* استفاده از فونت و رنگ شما */}
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-4">چرا بیک‌جوی را انتخاب کنید؟</h2> {/* عنوان فارسی */}
          <p className="max-w-2xl mx-auto text-text-secondary">ما فراتر از انتظار عمل می‌کنیم تا جشن‌های شما را فراموش‌نشدنی کنیم</p> {/* توضیحات فارسی */}
        </div>

        {/* گرید کارت‌های مزیت */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {valuesData.map((value) => (
            <ValueCard key={value.id} value={value} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;