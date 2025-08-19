// src/components/Home/BlogSection.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import BlogPostCard from '../Blog/BlogPostCard'; // ایمپورت کارت پست - مسیر را چک کنید
import type { BlogPostData } from '../../types'; // مسیر types را تنظیم کنید

// داده‌های نمونه برای پست‌های وبلاگ
const samplePostsData: BlogPostData[] = [
  {
    id: 1, slug: 'easy-decorating-techniques', imageUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=800&q=80', imageAlt: 'Cake decorating tips',
    category: 'نکات تزئین', title: '۵ تکنیک آسان تزئین کیک برای مبتدیان', excerpt: 'تکنیک‌های ساده اما چشمگیر تزئین را یاد بگیرید تا کیک‌های خانگی خود را ارتقا دهید.'
  },
  {
    id: 2, slug: 'wedding-cake-trends-2023', imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80', imageAlt: 'Wedding cake trends',
    category: 'ترندهای عروسی', title: 'ترندهای کیک عروسی ۲۰۲۵ که عاشقش می‌شوید', excerpt: 'محبوب‌ترین استایل‌ها و طعم‌های کیک عروسی امسال را کشف کنید.' // سال به ۲۰۲۵ تغییر کرد
  },
  {
    id: 3, slug: 'keep-cake-fresh', imageUrl: 'https://images.unsplash.com/photo-1558326567-98f2403ca647?auto=format&fit=crop&w=800&q=80', imageAlt: 'Cake storage tips',
    category: 'نکات نگهداری', title: 'چگونه کیک خود را برای مدت طولانی‌تری تازه نگه داریم؟', excerpt: 'نکات حرفه‌ای برای نگهداری انواع مختلف کیک برای حفظ تازگی.'
  },
];

const BlogSection: React.FC = () => {
  // در حالت واقعی، داده‌ها را از props یا API دریافت کنید
  const blogPosts = samplePostsData;

  return (
    // استفاده از bg-white
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        {/* عنوان و توضیحات */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-4">مجله کیک</h2> {/* عنوان فارسی */}
          <p className="max-w-2xl mx-auto text-text-secondary">نکات، ترندها و ایده‌ها از قنادی ما</p> {/* توضیحات فارسی */}
        </div>

        {/* گرید کارت‌های پست‌ها */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>

        {/* دکمه مشاهده همه مقالات */}
        <div className="text-center mt-12">
          <Link
            to="/blog" // لینک به صفحه اصلی وبلاگ
            className="border-2 border-accent text-accent px-8 py-3 rounded-full font-semibold font-body hover:bg-accent hover:text-white transition" // font-body
          >
            مشاهده همه مقالات
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;