// src/components/Testimonials/TestimonialCard.tsx
import React from 'react';
import type { TestimonialData } from '../../types'; // مسیر types را تنظیم کنید

// کامپوننت SVG ستاره (می‌توانید از کتابخانه آیکون هم استفاده کنید)
const StarIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

interface TestimonialCardProps {
  testimonial: TestimonialData;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  return (
    // !!! توجه: کلاس "testimonial-card" نیاز به تعریف CSS دارد (برای پس‌زمینه گرادینت) !!!
    <div className="testimonial-card p-8 rounded-2xl shadow-sm h-full flex flex-col"> {/* h-full و flex flex-col */}
      <div className="flex items-center mb-6">
        <img
          src={testimonial.imageUrl}
          alt={testimonial.name}
          className="w-16 h-16 rounded-full object-cover flex-shrink-0" // flex-shrink-0
        />
        {/* mr-4 برای فاصله در حالت RTL */}
        <div className="mr-4 flex-grow"> {/* flex-grow */}
          <h4 className="font-semibold font-body text-dark">{testimonial.name}</h4> {/* font-body, text-dark */}
          <div className="flex text-yellow-400 mt-1">
            {/* نمایش ستاره‌ها بر اساس امتیاز */}
            {[...Array(5)].map((_, index) => (
              <StarIcon
                key={index}
                // اگر امتیاز بیشتر یا مساوی ایندکس+۱ بود، ستاره پر (زرد) است، وگرنه کم‌رنگ
                className={`h-5 w-5 ${index < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
            {/* کد قبلی شما ۵ ستاره ثابت داشت، کد بالا داینامیک است */}
            {/*
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
             */}
          </div>
        </div>
      </div>
      {/* متن نظر */}
      <p className="text-text-secondary text-sm flex-grow">{testimonial.quote}</p> {/* text-text-secondary, flex-grow */}
    </div>
  );
};

export default TestimonialCard;