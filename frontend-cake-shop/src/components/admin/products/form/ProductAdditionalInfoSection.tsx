// src/components/admin/products/form/ProductAdditionalInfoSection.tsx
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import type { ProductFormValues } from '../../../../pages/admin/products/AdminProductForm'; // مسیر به تایپ فرم اصلی

// Props کامپوننت
interface ProductAdditionalInfoSectionProps {
  formMethods: UseFormReturn<ProductFormValues>;
}

// استایل‌های پایه (می‌تواند از یک فایل utils یا constants بیاید)
const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
const textareaBaseClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm";
const errorTextareaClasses = "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-transparent";
const defaultTextareaClasses = "border-gray-300 dark:border-slate-600 focus:ring-amber-500 focus:border-transparent";
const errorMessageClasses = "mt-1 text-sm text-red-600 dark:text-red-400";

const ProductAdditionalInfoSection: React.FC<ProductAdditionalInfoSectionProps> = ({
  formMethods,
}) => {
  const { register, formState: { errors } } = formMethods;

  return (
    <div className="form-section bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="form-section-header p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">اطلاعات تکمیلی</h3>
      </div>
      <div className="form-section-body p-4 sm:p-6 space-y-6">
        {/* Ingredients */}
        <div>
          <label htmlFor="product-ingredients" className={labelClasses}>
            مواد تشکیل دهنده
          </label>
          <textarea
            id="product-ingredients"
            {...register('ingredients_text')}
            rows={4}
            className={`${textareaBaseClasses} ${errors.ingredients ? errorTextareaClasses : defaultTextareaClasses}`}
            placeholder="لیست مواد اولیه و ترکیبات محصول..."
          ></textarea>
          {errors.ingredients && <p className={errorMessageClasses}>{errors.ingredients.message}</p>}
        </div>

        {/* Nutrition Information */}
        <div>
          <label htmlFor="product-nutrition" className={labelClasses}>
            اطلاعات ارزش غذایی
          </label>
          <textarea
            id="product-nutrition"
            {...register('nutrition_info_text')}
            rows={4}
            className={`${textareaBaseClasses} ${errors.nutrition_info ? errorTextareaClasses : defaultTextareaClasses}`}
            placeholder="اطلاعات کالری، چربی، قند و سایر موارد در هر سروینگ یا ۱۰۰ گرم..."
          ></textarea>
          {errors.nutrition_info && <p className={errorMessageClasses}>{errors.nutrition_info.message}</p>}
        </div>

        {/* Allergen Information */}
        <div>
          <label htmlFor="product-allergens" className={labelClasses}>
            اطلاعات آلرژن‌ها
          </label>
          <textarea
            id="product-allergens"
            {...register('allergen_info_text')}
            rows={3}
            className={`${textareaBaseClasses} ${errors.allergen_info ? errorTextareaClasses : defaultTextareaClasses}`}
            placeholder="مواد آلرژی‌زا مانند گلوتن، مغزها، لبنیات و..."
          ></textarea>
          {errors.allergen_info && <p className={errorMessageClasses}>{errors.allergen_info.message}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProductAdditionalInfoSection;