// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import HeroSlider from '../components/Home/HeroSlider';
import SignatureCakes from '../components/Home/SignatureCakes';
import type { Cake } from '../types';
import { getProducts } from '../services/api'; 
import WhyChooseUs from '../components/Home/WhyChooseUs';
import HowToOrder from '../components/Home/HowToOrder';
import Testimonials from '../components/Home/Testimonials';
import BlogSection from '../components/Home/BlogSection';
import NewsletterSignUp from '../components/Home/NewsletterSignUp';

const HomePage: React.FC = () => {
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCakeData = async () => {
      try {
        setLoading(true);
        setError(null);
       const responseData = await getProducts({ limit: 4 });
        
        console.log("API Response for Cakes:", responseData);
        
        // --- ۲. کد هوشمند برای خواندن داده‌ها ---
        // این کد بررسی می‌کند که آیا پاسخ، یک آبجکت صفحه‌بندی شده است یا یک آرایه مستقیم
        const cakesArray = Array.isArray(responseData) 
          ? responseData 
          : responseData.results;
        
        // ۳. مطمئن می‌شویم که همیشه یک آرایه معتبر در state قرار می‌گیرد
        setCakes(Array.isArray(cakesArray) ? cakesArray : [])
        
      } catch (err) {
        setError('متاسفانه در بارگذاری کیک‌ها مشکلی پیش آمد.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCakeData();
  }, []); // آرایه خالی یعنی این effect فقط یک بار اجرا می‌شود


  return (
    <div>
      <HeroSlider />
      {loading && <div className="text-center py-10">در حال بارگذاری...</div>}
      {error && <div className="text-center py-10 text-red-600">{error}</div>}
      {!loading && !error && <SignatureCakes cakes={cakes} />}
      <WhyChooseUs />
      <HowToOrder />
      <Testimonials />
      <BlogSection /> 
      <NewsletterSignUp /> 
    </div>
  );
};

export default HomePage;