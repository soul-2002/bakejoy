// src/components/Home/Testimonials.tsx
import React from 'react';
import TestimonialCard from '../Testimonials/TestimonialCard'; // ایمپورت کارت نظر - مسیر را چک کنید
import type { TestimonialData } from '../../types'; // مسیر types را تنظیم کنید

// داده‌های نمونه برای نظرات
const sampleTestimonials: TestimonialData[] = [
  {
    id: 1,
    name: "سارا ج.", // Sarah J.
    imageUrl: "https://randomuser.me/api/portraits/women/32.jpg",
    rating: 5,
    quote: "کیک رویای مخملی قرمز بهترین بخش جشن تولد دخترم بود! همانقدر که زیبا بود، خوشمزه هم بود و همه مهمانان ما در موردش صحبت می‌کردند. بیک‌جوی فرآیند سفارش را بسیار آسان کرد و دقیقاً سر وقت تحویل داد.",
  },
  {
    id: 2,
    name: "مایکل ت.", // Michael T.
    imageUrl: "https://randomuser.me/api/portraits/men/75.jpg",
    rating: 5,
    quote: "من یک کیک سفارشی برای سالگرد ازدواج همسرم سفارش دادم و بیک‌جوی فراتر از تمام انتظارات عمل کرد. توجه به جزئیات باورنکردنی بود و طرحی که توصیف کرده بودم را کاملاً پیاده کردند. کیک مرطوب، خوش طعم و کاملاً خیره کننده بود. ارزش هر ریالش را داشت!",
  },
  // می‌توانید نظرات بیشتری اضافه کنید
];

const Testimonials: React.FC = () => {
  // در حالت واقعی، داده‌ها را از props یا API دریافت کنید
  const testimonials = sampleTestimonials;

  return (
    // استفاده از رنگ bg-light شما
    <section className="py-16 bg-light">
      <div className="container mx-auto px-6">
        {/* عنوان و توضیحات */}
        <div className="text-center mb-12 md:mb-16">
           {/* استفاده از فونت و رنگ شما */}
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-4">حرف‌های شیرین از مشتریان ما</h2> {/* عنوان فارسی */}
          <p className="max-w-2xl mx-auto text-text-secondary">فقط حرف ما را قبول نکنید - بشنوید مشتریان ما چه می‌گویند</p> {/* توضیحات فارسی */}
        </div>

        {/* گرید کارت‌های نظرات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;