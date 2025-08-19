// src/components/Blog/BlogPostCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { BlogPostData } from '../../types'; // مسیر types را تنظیم کنید

// کامپوننت SVG فلش (برای خوانایی بهتر)
const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
     {/* برای RTL، آیکون باید به سمت چپ اشاره کند (arrow-left) */}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    {/* کد اصلی شما برای فلش راست بود: d="M9 5l7 7-7 7" */}
  </svg>
);


interface BlogPostCardProps {
  post: BlogPostData;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
  const postLink = `/blog/${post.slug ?? post.id}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition duration-300 flex flex-col h-full"> {/* h-full */}
      <div className="h-48 overflow-hidden flex-shrink-0"> {/* flex-shrink-0 */}
        <img src={post.imageUrl} alt={post.imageAlt} className="w-full h-full object-cover" />
      </div>
      <div className="p-6 flex flex-col flex-grow"> {/* flex-grow */}
        {/* دسته‌بندی */}
        <div className="text-sm text-accent font-semibold mb-2">{post.category}</div>
        {/* عنوان پست */}
        <h3 className="text-xl font-semibold font-body mb-3 text-dark flex-grow">{post.title}</h3> {/* font-body, text-dark, flex-grow */}
        {/* خلاصه پست */}
        <p className="text-text-secondary text-sm mb-4">{post.excerpt}</p> {/* text-text-secondary */}
        {/* لینک ادامه مطلب */}
        <Link
          to={postLink}
          className="text-accent font-semibold hover:text-dark transition flex items-center mt-auto" // mt-auto
        >
          ادامه مطلب
          {/* mr-1 برای فاصله در حالت RTL */}
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
        </Link>
      </div>
    </div>
  );
};

export default BlogPostCard;