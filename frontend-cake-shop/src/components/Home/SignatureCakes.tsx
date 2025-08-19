// src/components/Home/SignatureCakes.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../Products/ProductCard';
// --- ایمپورت کردن اینترفیس Cake ---
import type { Cake } from '../../types';

// --- داده‌های نمونه حذف شد ---
// const sampleCakeData: Cake[] = [ ... ]; // دیگر لازم نیست

interface SignatureCakesProps {
  cakes: Cake[]; // <-- تغییر از CakeData[] به Cake[] - این prop حالا اجباری است
  title?: string;
  description?: string;
}

const SignatureCakes: React.FC<SignatureCakesProps> = ({
  cakes, // دریافت داده‌ها از props
  title = "کیک‌های ویژه ما",
  description = "هر کیک با اشتیاق و دقت ساخته می‌شود تا لحظات فراموش‌نشدنی خلق کند"
}) => {
  // اگر هیچ کیکی وجود نداشت، شاید بخواهید پیامی نمایش دهید یا بخش را رندر نکنید
  if (!cakes || cakes.length === 0) {
     // return <p>کیک ویژه‌ای یافت نشد.</p>; // یا null یا هر چیز دیگر
     return null; // فعلا چیزی نمایش نمی‌دهیم
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-4">{title}</h2>
          <p className="max-w-2xl mx-auto text-text-secondary">{description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* --- Map کردن روی داده‌های واقعی Cake --- */}
          {cakes.map((cake) => (
            <ProductCard key={cake.id} cake={cake} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/products"
            className="border-2 border-accent text-accent px-8 py-3 rounded-full font-semibold font-body hover:bg-accent hover:text-white transition"
          >
            مشاهده همه کیک‌ها
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SignatureCakes;