// src/components/admin/products/form/ProductGeneralInfoSection.tsx
import React, { useEffect } from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { ProductCategoryType,ProductFormValues } from '../../../../types'; // تایپ Category که برای محصولات استفاده می‌شود
// import TagInput from '../../common/TagInput'; // کامپوننت سفارشی برای برچسب‌ها (بعداً می‌سازیم)
// import RichTextEditor from '../../common/RichTextEditor'; // کامپوننت ویرایشگر متن (بعداً اضافه می‌کنیم)

import { TagInput } from '../TagInput'
// تایپ مقادیر فرم که این بخش با آن‌ها کار می‌کند (بخشی از ProductFormValues)

// Props کامپوننت
interface ProductGeneralInfoSectionProps {
  formMethods: UseFormReturn<ProductFormValues>; // توابع و state از react-hook-form
  categories: ProductCategoryType[]; // لیست دسته‌بندی‌ها برای نمایش در select
  // onGenerateSlug: () => void; // تابع برای تولید اسلاگ (می‌تواند داخل همین کامپوننت باشد)
}

const ProductGeneralInfoSection: React.FC<ProductGeneralInfoSectionProps> = ({
  formMethods,
  categories,
}) => {
  const { register, formState: { errors }, control, watch, setValue } = formMethods;
  const nameValue = watch('name'); // برای تولید خودکار اسلاگ

  const generateSlugFromName = () => {
    if (nameValue) {
      const slug = nameValue
        .toString().trim().toLowerCase()
        .replace(/\s+/g, '-') // جایگزینی فاصله‌ها با خط تیره
        .replace(/[^a-z0-9-]/g, '') // حذف کاراکترهای غیرمجاز (فقط حروف کوچک انگلیسی، اعداد و خط تیره)
        .replace(/-+/g, '-') // جایگزینی چند خط تیره با یک خط تیره
        .replace(/^-+|-+$/g, ''); // حذف خط تیره از ابتدا و انتها
      setValue('slug', slug, { shouldValidate: true });
    }
  };

  // کلاس‌های پایه برای input ها و پیام خطا برای جلوگیری از تکرار
  // اینها را می‌توانید در یک فایل utils یا constants هم تعریف کنید
  const baseInputClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm";
  const errorInputClasses = "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-transparent";
  const defaultInputClasses = "border-gray-300 dark:border-slate-600 focus:ring-amber-500 focus:border-transparent";
  const errorMessageClasses = "mt-1 text-sm text-red-600 dark:text-red-400";


  return (
    <div className="form-section bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="form-section-header p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">اطلاعات اصلی</h3>
      </div>
      <div className="form-section-body p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Name */}
          <div className="md:col-span-2">
            <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              نام محصول <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="product-name"
              {...register('name')}
              className={`${baseInputClasses} ${errors.name ? errorInputClasses : defaultInputClasses}`}
              placeholder="مثال: کیک شکلاتی ویژه"
            />
            {errors.name && <p className={errorMessageClasses}>{errors.name.message}</p>}
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="product-slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              اسلاگ (URL) <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <input
                type="text"
                id="product-slug"
                {...register('slug')}
                className={`${baseInputClasses} rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none flex-grow ${errors.slug ? errorInputClasses : defaultInputClasses}`}
                placeholder="مثال: chocolate-cake"
              />
              <button
                type="button"
                onClick={generateSlugFromName}
                title="تولید خودکار اسلاگ از نام"
                className="px-3 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 border border-l-0 rtl:border-r-0 rtl:border-l border-gray-300 dark:border-slate-500 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none hover:bg-gray-200 dark:hover:bg-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <FontAwesomeIcon icon={faSyncAlt} />
              </button>
            </div>
            {errors.slug && <p className={errorMessageClasses}>{errors.slug.message}</p>}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">فقط حروف کوچک انگلیسی، اعداد و خط تیره.</p>
          </div>

          {/* Status (is_active) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت انتشار <span className="text-red-500">*</span></label>
            <Controller
              name="is_active" // یا اگر فیلد status جداگانه با گزینه‌های بیشتر دارید: name="status"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-3 rtl:space-x-reverse mt-2">
                  {/* شما می‌توانید از دکمه toggle که قبلاً برای فرم دسته‌بندی ساختیم استفاده کنید */}
                  <button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center w-auto border transition-colors
                                ${field.value === true ? 'bg-green-500 text-white border-green-500' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-slate-600 dark:text-gray-200 dark:border-slate-500 dark:hover:bg-slate-500'}`}
                    aria-pressed={field.value === true}
                  >
                    <FontAwesomeIcon icon={faToggleOn} className={`mr-2 rtl:ml-2 text-lg ${field.value === true ? '' : 'hidden'}`} />
                    <FontAwesomeIcon icon={faToggleOff} className={`mr-2 rtl:ml-2 text-lg ${field.value === false ? '' : 'hidden'}`} />
                    فعال (نمایش در سایت)
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center w-auto border transition-colors
                                ${field.value === false ? 'bg-red-500 text-white border-red-500' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-slate-600 dark:text-gray-200 dark:border-slate-500 dark:hover:bg-slate-500'}`}
                    aria-pressed={field.value === false}
                  >
                    <FontAwesomeIcon icon={faToggleOff} className={`mr-2 rtl:ml-2 text-lg ${field.value === false ? '' : 'hidden'}`} />
                    <FontAwesomeIcon icon={faToggleOn} className={`mr-2 rtl:ml-2 text-lg ${field.value === true ? '' : 'hidden'}`} />
                    غیرفعال (عدم نمایش)
                  </button>
                  {/* اگر وضعیت‌های بیشتری مانند "پیش‌نویس" دارید، از Select استفاده کنید */}
                </div>
              )}
            />
            {errors.is_active && <p className={errorMessageClasses}>{errors.is_active.message}</p>}
          </div>

          {/* Categories (Multi-select) */}
          <div className="md:col-span-2">
            <label htmlFor="product-categories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              دسته‌بندی‌ها <span className="text-red-500">*</span>
            </label>
            {/* TODO: اینجا یک کامپوننت MultiSelect خوب (مانند react-select) لازم است. */}
            {/* مثال خیلی ساده با select multiple (تجربه کاربری خوبی ندارد): */}
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <select
                  id="product-categories"
                  multiple
                  className={`${baseInputClasses} h-32 ${errors.category ? errorInputClasses : defaultInputClasses}`}
                  value={field.value?.map(String)} // value باید آرایه‌ای از string باشد
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => Number(option.value));
                    field.onChange(selectedIds);
                  }}
                >
                  {categories.length === 0 && <option disabled>در حال بارگذاری دسته‌بندی‌ها...</option>}
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            />
            {errors.category && <p className={errorMessageClasses}>{errors.category.message}</p>}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">یک یا چند دسته‌بندی را انتخاب کنید (Ctrl/Cmd + کلیک).</p>
          </div>

          {/* is_featured (محصول ویژه) - چک‌باکس ساده */}
          <div className="md:col-span-2 flex items-center space-x-3 rtl:space-x-reverse mt-2">
            <Controller
              name="is_featured"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <input
                  id="is_featured"
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 text-amber-600 border-gray-300 dark:border-slate-600 rounded focus:ring-amber-500 dark:bg-slate-900 dark:focus:ring-offset-slate-800"
                />
              )}
            />
            <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              این محصول ویژه است (در بخش‌های خاص نمایش داده شود)
            </label>
          </div>


          {/* Tags (نیاز به کامپوننت TagInput دارد) */}
          <div className="md:col-span-2">
            <label htmlFor="product-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              برچسب‌ها (با Enter جدا کنید)
            </label>
            {/* TODO: کامپوننت TagInput را اینجا قرار دهید و به react-hook-form متصل کنید */}
            <Controller
              name="tags"
              control={control}
              defaultValue={[]} // مقدار پیش‌فرض را به صراحت یک آرایه خالی قرار دهید
              render={({ field }) => (
                <TagInput
                  // --- لایه محافظتی: همیشه یک آرایه به کامپوننت پاس بدهید ---
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="مثال: شکلاتی، میوه‌ای..."
                />
              )}
            />
            {errors.tags && <p className={errorMessageClasses}>{errors.tags.message}</p>}
          </div>

          {/* Short Description */}
          <div className="md:col-span-2">
            <label htmlFor="product-short-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              توضیحات کوتاه (برای لیست محصولات)
            </label>
            <textarea
              id="product-short-desc"
              {...register('short_description')}
              rows={3}
              className={`${baseInputClasses} ${errors.short_description ? errorInputClasses : defaultInputClasses}`}
              placeholder="توضیح مختصر درباره محصول..."
            ></textarea>
            {errors.short_description && <p className={errorMessageClasses}>{errors.short_description.message}</p>}
          </div>

          {/* Full Description (Rich Text Editor placeholder) */}
          <div className="md:col-span-2">
            <label htmlFor="product-full-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              توضیحات کامل (برای صفحه محصول)
            </label>
            {/* TODO: کامپوننت ویرایشگر متن غنی را اینجا قرار دهید و به react-hook-form متصل کنید */}
            {/* <Controller name="full_description" control={control} render={({ field }) => <RichTextEditor {...field} />} /> */}
            <textarea
              id="product-full-desc"
              {...register('description')}
              rows={6}
              className={`${baseInputClasses} min-h-[200px] ${errors.full_description ? errorInputClasses : defaultInputClasses}`}
              placeholder="توضیحات کامل محصول شامل مواد، نحوه آماده‌سازی و..."
            ></textarea>
            {errors.full_description && <p className={errorMessageClasses}>{errors.full_description.message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// کلاس‌های کمکی Tailwind (می‌توانید در فایل CSS اصلی با @apply تعریف کنید یا مستقیماً استفاده کنید)
// .input-base { @apply w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm; }
// .input-default { @apply border-gray-300 dark:border-slate-600 focus:ring-amber-500 focus:border-transparent; }
// .input-error { @apply border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-transparent; }
// .error-text { @apply mt-1 text-sm text-red-600 dark:text-red-400; }
// .badge-gray { @apply bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center m-1 dark:bg-slate-600 dark:text-slate-200; }


export default ProductGeneralInfoSection; // اگر این را به عنوان یک فایل جداگانه می‌سازید