// src/components/admin/products/form/ProductPricingSection.tsx
import React, { useState } from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faTag, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import type { ProductFormValues } from '../../../../pages/admin/products/AdminProductFormPage'; // مسیر به تایپ فرم اصلی

// Props کامپوننت
interface ProductPricingSectionProps {
  formMethods: UseFormReturn<ProductFormValues>;
}

const ProductPricingSection: React.FC<ProductPricingSectionProps> = ({
  formMethods,
}) => {
  const { register, formState: { errors }, control, watch, setValue } = formMethods;

  const [showSaleSchedule, setShowSaleSchedule] = useState(false); // برای نمایش/عدم نمایش فیلدهای زمان‌بندی تخفیف

  // کلاس‌های پایه برای input ها و پیام خطا (می‌تواند از یک فایل utils بیاید)
  const baseInputClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm text-left rtl:text-right"; // text-left برای اعداد
  const errorInputClasses = "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-transparent";
  const defaultInputClasses = "border-gray-300 dark:border-slate-600 focus:ring-amber-500 focus:border-transparent";
  const errorMessageClasses = "mt-1 text-sm text-red-600 dark:text-red-400";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";


  return (
    <div className="form-section bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="form-section-header p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">قیمت‌گذاری</h3>
      </div>
      <div className="form-section-body p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Base Price */}
          <div>
            <label htmlFor="base-price" className={labelClasses}>
              قیمت پایه (تومان) <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="text" // استفاده از text برای اجازه به فرمت‌دهی و کاما، اعتبارسنجی با Zod
                id="base-price"
                {...register('base_price')}
                className={`${baseInputClasses} ${errors.base_price ? errorInputClasses : defaultInputClasses} pl-7 rtl:pr-7`}
                placeholder="مثال: ۱۲۵۰۰۰۰"
              />
              <div className="absolute inset-y-0 left-0 rtl:right-0 pl-3 rtl:pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">تومان</span>
              </div>
            </div>
            {errors.base_price && <p className={errorMessageClasses}>{errors.base_price.message}</p>}
          </div>

          {/* Price Type */}
          <div>
            <label htmlFor="price-type" className={labelClasses}>نوع قیمت</label>
            <Controller
                name="price_type"
                control={control}
                defaultValue="FIXED" // مقدار پیش‌فرض
                render={({ field }) => (
                    <select
                        id="price-type"
                        {...field}
                        className={`${baseInputClasses} ${errors.price_type ? errorInputClasses : defaultInputClasses} appearance-none pr-8 rtl:pl-8 rtl:pr-3`}
                    >
                        <option value="FIXED">ثابت</option>
                        <option value="PER_KG">به ازای هر کیلوگرم</option>
                        <option value="PER_SERVING">به ازای هر نفر (اگر دارید)</option>
                    </select>
                )}
            />
             {/* TODO: اضافه کردن آیکون Chevron برای select */}
            {errors.price_type && <p className={errorMessageClasses}>{errors.price_type.message}</p>}
          </div>

          {/* Sale Price */}
          <div>
            <label htmlFor="sale-price" className={labelClasses}>
              قیمت با تخفیف (تومان) (اختیاری)
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="text"
                id="sale-price"
                {...register('sale_price')}
                className={`${baseInputClasses} ${errors.sale_price ? errorInputClasses : defaultInputClasses} pl-7 rtl:pr-7`}
                placeholder="مثال: ۱۰۰۰۰۰۰"
              />
              <div className="absolute inset-y-0 left-0 rtl:right-0 pl-3 rtl:pr-3 flex items-center pointer-events-none">
                 <span className="text-gray-500 dark:text-gray-400 sm:text-sm">تومان</span>
              </div>
            </div>
            {errors.sale_price && <p className={errorMessageClasses}>{errors.sale_price.message}</p>}
          </div>

          {/* Sale Schedule Toggle & Fields */}
          <div className="md:col-span-2"> {/* برای اینکه کل عرض را بگیرد */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
              <Controller
                name="schedule_sale_enabled" // یک فیلد جدید در Zod schema برای این تعریف کنید (boolean, optional)
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="schedule-sale"
                    checked={field.value}
                    onChange={(e) => {
                        field.onChange(e.target.checked);
                        setShowSaleSchedule(e.target.checked);
                        if (!e.target.checked) { // اگر غیرفعال شد، تاریخ‌ها را پاک کن
                            setValue('sale_start_date', null);
                            setValue('sale_end_date', null);
                        }
                    }}
                    className="h-4 w-4 text-amber-600 border-gray-300 dark:border-slate-600 rounded focus:ring-amber-500 dark:bg-slate-900 dark:focus:ring-offset-slate-800"
                  />
                )}
              />
              <label htmlFor="schedule-sale" className={`${labelClasses} mb-0 cursor-pointer`}>
                فعال کردن برنامه‌ریزی تخفیف
              </label>
            </div>
            
            {showSaleSchedule && (
              <div className="mt-2 space-y-4 p-4 border border-gray-200 dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-800/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label htmlFor="sale-start-date" className={`${labelClasses} text-xs`}>تاریخ شروع تخفیف</label>
                    <Controller
                        name="sale_start_date"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="date"
                                id="sale-start-date"
                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                                className={`${baseInputClasses} ${errors.sale_start_date ? errorInputClasses : defaultInputClasses}`}
                            />
                        )}
                    />
                    {errors.sale_start_date && <p className={errorMessageClasses}>{errors.sale_start_date.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="sale-end-date" className={`${labelClasses} text-xs`}>تاریخ پایان تخفیف</label>
                     <Controller
                        name="sale_end_date"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="date"
                                id="sale-end-date"
                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                                className={`${baseInputClasses} ${errors.sale_end_date ? errorInputClasses : defaultInputClasses}`}
                            />
                        )}
                    />
                    {errors.sale_end_date && <p className={errorMessageClasses}>{errors.sale_end_date.message}</p>}
                  </div>
                </div>
                 {errors.sale_price?.message?.includes("کمتر از قیمت پایه") && ( /* نمایش خطای کلی اگر مربوط به این بخش است */
                    <p className={errorMessageClasses}>{errors.sale_price.message}</p>
                )}
                 {errors.sale_end_date?.message?.includes("بعد از تاریخ شروع") && (
                    <p className={errorMessageClasses}>{errors.sale_end_date.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPricingSection;