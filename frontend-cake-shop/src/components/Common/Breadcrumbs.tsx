// src/components/Common/Breadcrumbs.tsx (یا هر مسیری که برای کامپوننت‌های عمومی دارید)
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography'; // برای حفظ استایل متن اگر لازم است یا با <p> جایگزین کنید

interface BreadcrumbItem {
  label: string;
  href?: string; // اگر لینک ندارد، فقط به عنوان متن نمایش داده می‌شود
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  // می‌توانید کلاس‌های Tailwind بیشتری را از طریق props پاس بدهید اگر نیاز به سفارşı‌سازی بیشتر بود
  className?: string;
  separatorClassName?: string;
  linkClassName?: string;
  textClassName?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = "bg-amber-50 py-3", // کلاس‌های پیش‌فرض برای نوار پس‌زمینه
  separatorClassName = "text-gray-400 text-xs mx-1", // کلاس برای جداکننده
  linkClassName = "text-amber-600 hover:underline", // کلاس برای لینک‌ها
  textClassName = "text-gray-600" // کلاس برای آیتم آخر (متن)
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className={className}>
      <div className="container mx-auto px-4">
        <ol className="flex items-center space-x-2 space-x-reverse text-sm">
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.href ? (
                <li>
                  <RouterLink to={item.href} className={linkClassName}>
                    {item.label}
                  </RouterLink>
                </li>
              ) : (
                <li className={textClassName}>{item.label}</li>
              )}
              {index < items.length - 1 && (
                <li className={separatorClassName} aria-hidden="true">
                  {'>'} {/* جداکننده جدید */}
                </li>
              )}
            </React.Fragment>
          ))}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;