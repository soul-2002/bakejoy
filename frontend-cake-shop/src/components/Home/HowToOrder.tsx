// src/components/Home/HowToOrder.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // برای دکمه نهایی
import StepCard from '../HowToOrder/StepCard'; // ایمپورت کارت مرحله - مسیر را چک کنید
import type { StepData } from '../../types'; // مسیر types را تنظیم کنید

// تعریف داده‌های مراحل
const stepsData: StepData[] = [
  {
    id: 1,
    stepNumber: 1,
    title: "کیک خود را انتخاب کنید", // Choose Your Cake
    description: "مجموعه ما را مرور کنید و کیک مورد علاقه خود را انتخاب کنید یا کیک خود را سفارشی کنید."
  },
  {
    id: 2,
    stepNumber: 2,
    title: "آن را شخصی‌سازی کنید", // Personalize It
    description: "تزئینات، طعم‌ها یا پیام‌های ویژه اضافه کنید تا آن را منحصر به فرد کنید."
  },
  {
    id: 3,
    stepNumber: 3,
    title: "سفارش خود را ثبت کنید", // Place Your Order
    description: "تاریخ تحویل یا دریافت حضوری را انتخاب کنید و سفارش خود را به صورت آنلاین و امن تکمیل کنید."
  },
];

const HowToOrder: React.FC = () => {
  return (
    // استفاده از bg-white
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        {/* عنوان و توضیحات بخش */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-4">چگونه سفارش دهیم؟</h2> {/* عنوان فارسی */}
          <p className="max-w-2xl mx-auto text-text-secondary">گرفتن کیک عالی شما به آسانی ۱-۲-۳ است</p> {/* توضیحات فارسی */}
        </div>

        {/* نگهدارنده مراحل */}
         {/* نکته: در حالت RTL، space-x-12 ممکن است نیاز به space-x-reverse-12 داشته باشد */}
        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-12">
          {stepsData.map((step) => (
            <StepCard key={step.id} step={step} />
          ))}
        </div>

        {/* دکمه شروع سفارش */}
        <div className="text-center mt-16">
          {/* تبدیل button به Link */}
          <Link
            to="/products" // یا هر لینکی که فرآیند سفارش را شروع می‌کند
            className="bg-accent text-white px-8 py-3 rounded-full font-semibold font-body hover:bg-dark transition shadow-lg" // font-body, hover:bg-dark
          >
            سفارش خود را شروع کنید
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowToOrder;