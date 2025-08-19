// src/components/admin/products/form/ProductSeoSection.tsx
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import type { ProductFormValues } from '../../../../pages/admin/products/AdminProductForm'; // مسیر به تایپ فرم اصلی

// Props کامپوننت
interface ProductSeoSectionProps {
  formMethods: UseFormReturn<ProductFormValues>;
}

// استایل‌های پایه (می‌تواند از یک فایل utils یا constants بیاید)
const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
const inputBaseClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm";
const textareaBaseClasses = inputBaseClasses; // می‌تواند مشابه input باشد
const errorInputClasses = "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-transparent";
const defaultInputClasses = "border-gray-300 dark:border-slate-600 focus:ring-amber-500 focus:border-transparent";
const errorMessageClasses = "mt-1 text-sm text-red-600 dark:text-red-400";
const helpTextClasses = "mt-1 text-xs text-gray-500 dark:text-gray-400";


const ProductSeoSection: React.FC<ProductSeoSectionProps> = ({
  formMethods,
}) => {
  const { register, watch, formState: { errors } } = formMethods;

  // شمارنده کاراکترها
  const metaTitleValue = watch('meta_title') || '';
  const metaDescriptionValue = watch('meta_description') || '';

  return (
    <div className="form-section bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="form-section-header p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">تنظیمات سئو (SEO)</h3>
      </div>
      <div className="form-section-body p-4 sm:p-6 space-y-6">
        {/* Meta Title */}
        <div>
          <label htmlFor="meta-title" className={labelClasses}>
            عنوان سئو (Meta Title)
          </label>
          <input
            type="text"
            id="meta-title"
            {...register('meta_title')}
            className={`${inputBaseClasses} ${errors.meta_title ? errorInputClasses : defaultInputClasses}`}
            placeholder="عنوانی جذاب برای موتورهای جستجو (حدود ۶۰ کاراکتر)"
          />
          <p className={helpTextClasses}>
            بهینه‌شده: {metaTitleValue.length.toLocaleString('fa-IR')} / ۷۰ کاراکتر
          </p>
          {errors.meta_title && <p className={errorMessageClasses}>{errors.meta_title.message}</p>}
        </div>

        {/* Meta Description */}
        <div>
          <label htmlFor="meta-description" className={labelClasses}>
            توضیحات سئو (Meta Description)
          </label>
          <textarea
            id="meta-description"
            {...register('meta_description')}
            rows={3}
            className={`${textareaBaseClasses} ${errors.meta_description ? errorInputClasses : defaultInputClasses}`}
            placeholder="توضیح مختصر و جذاب برای نمایش در نتایج جستجو (حدود ۱۶۰ کاراکتر)"
          ></textarea>
          <p className={helpTextClasses}>
            بهینه‌شده: {metaDescriptionValue.length.toLocaleString('fa-IR')} / ۱۶۰ کاراکتر
          </p>
          {errors.meta_description && <p className={errorMessageClasses}>{errors.meta_description.message}</p>}
        </div>

        {/* Meta Keywords */}
        <div>
          <label htmlFor="meta-keywords" className={labelClasses}>
            کلمات کلیدی متا (جدا شده با کاما)
          </label>
          <input
            type="text"
            id="meta-keywords"
            {...register('meta_keywords')}
            className={`${inputBaseClasses} ${errors.meta_keywords ? errorInputClasses : defaultInputClasses}`}
            placeholder="مثال: کیک شکلاتی, کیک تولد, سفارش کیک آنلاین"
          />
          {errors.meta_keywords && <p className={errorMessageClasses}>{errors.meta_keywords.message}</p>}
          <p className={helpTextClasses}>
            استفاده از متا کیوردز دیگر اهمیت زیادی ندارد، اما می‌توانید اضافه کنید.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductSeoSection;