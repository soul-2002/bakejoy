// src/pages/admin/categories/AdminCategoryFormPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faSave, faTimes, faCheck, faSpinner, faCloudUploadAlt, faTrash, faSyncAlt, faToggleOff, faToggleOn
} from '@fortawesome/free-solid-svg-icons';

import AdminPageLayout from '../../../components/admin/layout/AdminPageLayout'; // فرض بر وجود این کامپوننت
import { useAuth } from '../../../contexts/AuthContext';
import {
  createAdminCategory,
  getAdminCategoryDetail,
  updateAdminCategory
} from '../../../services/api'; // توابع API
import { Category, NewCategoryData } from '../../../types'; // تایپ‌ها

// استایل‌های سفارشی برای آپلود فایل را ایمپورت کنید
// import '../../../styles/forms.css'; // یا مسیر دیگر

// اسکیمای اعتبارسنجی با Zod
const categoryFormSchema = z.object({
  name: z.string().min(3, "نام دسته‌بندی حداقل باید ۳ کاراکتر باشد.").max(100, "نام دسته‌بندی نباید بیشتر از ۱۰۰ کاراکتر باشد."),
  // slug: z.string().min(3, "اسلاگ حداقل باید ۳ کاراکتر باشد.").max(100, "اسلاگ نباید بیشتر از ۱۰۰ کاراکتر باشد.")
  //   .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "اسلاگ فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد و با خط تیره شروع یا تمام نشود."),
  // description: z.string().max(500, "توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد.").optional().nullable(),
  slug: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  image: z.instanceof(FileList).optional() // برای آپلود فایل، بعداً برای ارسال به API باید File را جدا کنیم
    .refine(files => files === undefined || files === null || files.length === 0 || (files?.[0]?.size && files[0].size <= 2 * 1024 * 1024), `حداکثر حجم فایل ۲ مگابایت است.`)
    .refine(files => files === undefined || files === null || files.length === 0 || (files?.[0]?.type && ['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type)), 'فقط فرمت‌های JPG, PNG, WEBP مجاز هستند.')
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface AdminCategoryFormPageProps {
  // اگر این کامپوننت برای افزودن و ویرایش استفاده می‌شود، می‌توان یک prop mode داشت
}

const AdminCategoryFormPage: React.FC<AdminCategoryFormPageProps> = () => {
  const { categoryId } = useParams<{ categoryId?: string }>(); // برای حالت ویرایش
  const isEditMode = Boolean(categoryId);
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [pageLoading, setPageLoading] = useState(isEditMode); // لودینگ اولیه برای واکشی داده در حالت ویرایش

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null); // برای نمایش تصویر فعلی در حالت ویرایش
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    clearErrors // <--- clearErrors را اینجا اضافه کنید
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      is_active: true,
      image: undefined,
    }
  });

  const categoryNameValue = watch('name'); // برای تولید خودکار اسلاگ

  // واکشی داده‌های دسته‌بندی در حالت ویرایش
  const fetchCategoryForEdit = useCallback(async () => {
    if (isEditMode && categoryId && accessToken) {
      console.log(`Workspaceing category with ID: ${categoryId} for editing.`);
      setPageLoading(true);
      setFormError(null);
      try {
        const categoryData = await getAdminCategoryDetail(accessToken, categoryId);
        reset({ // پر کردن فرم با داده‌های موجود
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description || '',
          is_active: categoryData.is_active,
          image: undefined, // input فایل را با فایل پر نمی‌کنیم، فقط پیش‌نمایش را نشان می‌دهیم
        });
        if (categoryData.image) {
          setImagePreview(categoryData.image); // URL تصویر موجود را برای پیش‌نمایش تنظیم کن
          setCurrentImageUrl(categoryData.image); // URL تصویر موجود را ذخیره کن
        }
        console.log("Category data loaded for edit:", categoryData);
      } catch (err: any) {
        console.error("Error fetching category details for edit:", err);
        setFormError("خطا در دریافت اطلاعات دسته‌بندی برای ویرایش: " + (err.message || ""));
        // navigate('/admin/categories'); // یا نمایش پیام و عدم بارگذاری فرم
      } finally {
        setPageLoading(false);
      }
    }
  }, [categoryId, isEditMode, accessToken, reset]);

  useEffect(() => {
    fetchCategoryForEdit();
  }, [fetchCategoryForEdit]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log("M1 - handleImageChange: FileList from event.target.files:", files);
    clearErrors("image"); // پاک کردن خطای قبلی تصویر
    if (files && files.length > 0) {
      const file = files[0];
      console.log("M1 - handleImageChange: Selected file object:", file);
      // اعتبارسنجی اولیه در کلاینت (اختیاری، چون Zod هم انجام می‌دهد)
      if (file.size > 2 * 1024 * 1024) {
        // setError('image', { type: 'manual', message: 'حجم فایل بیش از ۲ مگابایت است.' });
        alert('حجم فایل بیش از ۲ مگابایت است.');
        event.target.value = ''; // پاک کردن انتخاب فایل
        setImagePreview(currentImageUrl); // بازگرداندن پیش‌نمایش به تصویر قبلی (اگر بود)
        // setValue('image', undefined);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        // setError('image', { type: 'manual', message: 'فرمت‌های مجاز: JPG, PNG, WEBP.' });
        alert('فرمت‌های مجاز: JPG, PNG, WEBP.');
        event.target.value = '';
        setImagePreview(currentImageUrl);
        // setValue('image', undefined);
        return;
      }

      // setValue('image', files, { shouldValidate: true });
      console.log("M1 - handleImageChange: Called setValue('image', files). Current form value for 'image':", watch('image'));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // setValue('image', undefined);
      setImagePreview(currentImageUrl); // اگر کاربر انتخاب فایل را لغو کرد، پیش‌نمایش را به تصویر قبلی برگردان
    }
  };

  const removeImage = () => {
    setValue('image', undefined, { shouldValidate: true }); // مقدار فایل را در react-hook-form null کن
    setImagePreview(null); // پیش‌نمایش را پاک کن
    // currentImageUrl را null نکنید مگر اینکه بخواهید با ذخیره، تصویر قبلی هم حذف شود
    // اگر input فایل را ریست می‌کنید:
    const fileInput = document.getElementById('category-image-upload') as HTMLInputElement; // ID جدید برای input
    if (fileInput) fileInput.value = '';
  };


  const generateSlug = () => {
    if (categoryNameValue) {
      const originalName = categoryNameValue.toString().trim();
      console.log("Original Name:", `"${originalName}"`); // با کوتیشن برای دیدن فضاهای احتمالی

      const step1 = originalName.toLowerCase();
      console.log("Step 1 (toLowerCase):", `"${step1}"`);

      // این خط مهم است: آیا کاراکترهای فارسی یا خاص دیگر اینجا حذف می‌شوند؟
      const step2 = step1.replace(/[^a-z0-9\s-]/g, '');
      console.log("Step 2 (remove non-alphanumeric except space/dash):", `"${step2}"`);

      const step3 = step2.replace(/[\s-]+/g, '-');
      console.log("Step 3 (replace space/multiple-dashes with single dash):", `"${step3}"`);

      const finalSlug = step3.replace(/^-+|-+$/g, '');
      console.log("Final Generated Slug:", `"${finalSlug}"`);
      console.log("Is finalSlug 'birthday-cake'?", finalSlug === "birthday-cake");

      // تست regex با اسلاگ نهایی
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      console.log(`Regex test with "${finalSlug}":`, slugRegex.test(finalSlug));

      setValue('slug', finalSlug, { shouldValidate: true });
    }
  };

  const onSubmit: SubmitHandler<CategoryFormValues> = async (formDataValues) => {
    console.log("M2 - onSubmit: formDataValues received from react-hook-form:", formDataValues);
    console.log("M2 - onSubmit: formDataValues.image:", formDataValues.image);
    if (!accessToken) {
      setFormError("توکن دسترسی موجود نیست. لطفاً دوباره وارد شوید.");
      return;
    }
    setLoading(true); // یا استفاده از isSubmitting از react-hook-form
    setFormError(null);
    setSuccessMessage(null);

    // آماده‌سازی داده‌ها برای ارسال به API
    // این آبجکت‌ها با تایپ‌هایی که توابع API شما انتظار دارند، مطابقت دارند
    const categoryPayloadData = {
      name: formDataValues.name,
      slug: formDataValues.slug, // فقط اگر بک‌اند انتظار دارد slug ارسال شود و خودش آن را نمی‌سازد
      description: (formDataValues.description && formDataValues.description.trim() !== '') ? formDataValues.description : null,
      is_active: formDataValues.is_active,
    };

    const imageToUpload = (formDataValues.image && formDataValues.image.length > 0) ? formDataValues.image[0] : null;
    if (imageToUpload instanceof File) {
      console.log("M2 - onSubmit: imageToUpload IS a File object:", imageToUpload.name, imageToUpload.size, imageToUpload.type);
    } else {
      console.log("M2 - onSubmit: imageToUpload IS NOT a File or is null. Value:", imageToUpload);
    }
    // برای دیباگ می‌توانید payload و فایل تصویر را لاگ کنید:
    console.log("Data to be sent to API:", categoryPayloadData);
    if (imageToUpload) {
      console.log("Image file TO BE UPLOADED (from AdminCategoryFormPage):", imageToUpload.name, imageToUpload.size, imageToUpload.type);
    }
    else {
      console.log("NO Image file to be uploaded (from AdminCategoryFormPage)."); // <--- اگر این لاگ را می‌بینید، یعنی imageToUpload در اینجا null است
    }
    if (isEditMode && !imageToUpload && !currentImageUrl) { // اگر تصویر قبلی حذف شده و تصویر جدیدی نیست
      console.log("Image will be removed/cleared on update.");
      // ممکن است نیاز باشد categoryPayloadData.remove_image = true; را اینجا تنظیم کنید
      // یا imageToUpload را به یک مقدار خاص (مثل رشته خالی یا null صریح) برای حذف ست کنید،
      // بسته به اینکه تابع updateAdminCategory و بک‌اند شما چطور حذف تصویر را مدیریت می‌کنند.
      // برای مثال ساده، فرض می‌کنیم اگر imageToUpload، null باشد و در حالت ویرایش باشیم،
      // تابع updateAdminCategory می‌داند که تصویر نباید آپدیت شود یا اگر remove_image داشته باشد، آن را حذف می‌کند.
    }


    try {
      let responseMessage = '';
      if (isEditMode && categoryId) {
        // برای آپدیت، ممکن است بخواهید UpdateCategoryFormData متفاوت از NewCategoryData باشد
        // و فقط فیلدهای تغییر یافته را ارسال کنید، اما فعلاً همه فیلدها را می‌فرستیم.
        // تابع updateAdminCategory مسئول ساخت FormData خواهد بود.
        console.log("M2 - onSubmit: Calling updateAdminCategory with imageToUpload:", imageToUpload);
        const updatedCategory = await updateAdminCategory(
          accessToken,
          categoryId,
          categoryPayloadData as UpdateCategoryData, // Cast به تایپ مناسب اگر لازم است
          imageToUpload
        );
        responseMessage = `دسته‌بندی "${updatedCategory.name}" با موفقیت ویرایش شد.`;
        if (updatedCategory.image) {
          setCurrentImageUrl(updatedCategory.image); // آپدیت URL تصویر فعلی با پاسخ سرور
          setImagePreview(updatedCategory.image);   // آپدیت پیش‌نمایش
        } else if (!imageToUpload) { // اگر تصویری آپلود نشده (و شاید حذف شده)
          setCurrentImageUrl(null);
          setImagePreview(null);
        }
      } else {
        console.log("M2 - onSubmit: Calling createAdminCategory with imageToUpload:", imageToUpload);

        // تابع createAdminCategory مسئول ساخت FormData خواهد بود.
        const newCategory = await createAdminCategory(
          accessToken,
          categoryPayloadData as NewCategoryData, // Cast به تایپ مناسب
          imageToUpload
        );
        responseMessage = `دسته‌بندی "${newCategory.name}" با موفقیت ایجاد شد.`;
        reset(); // ریست کردن فرم پس از ایجاد موفق
        setImagePreview(null);
        setCurrentImageUrl(null);
        const fileInput = document.getElementById('category-image-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = ''; // پاک کردن مقدار input فایل
      }
      setSuccessMessage(responseMessage);
      setTimeout(() => {
        setSuccessMessage(null); // پاک کردن پیام موفقیت پس از چند ثانیه
        navigate('/admin/categories'); // بازگشت به لیست
      }, 2500);
    } catch (err: any) {
      console.error("Error saving category:", err);
      // بهبود نمایش خطا از پاسخ API
      let detailedError = "خطای ناشناخته در ذخیره‌سازی.";
      if (err && typeof err === 'object') {
        if (err.slug && Array.isArray(err.slug)) {
          detailedError = `اسلاگ: ${err.slug.join(', ')}`;
        } else if (err.detail) {
          detailedError = err.detail;
        } else { // خطاهای فیلد به فیلد
          const fieldErrors = Object.entries(err)
            .map(([key, value]) => `${key}: ${(Array.isArray(value) ? value.join(', ') : String(value))}`)
            .join('; ');
          if (fieldErrors) detailedError = fieldErrors;
        }
      } else if (typeof err === 'string') {
        detailedError = err;
      }
      setFormError(`خطا در ذخیره‌سازی دسته‌بندی: ${detailedError}`);
    } finally {
      setLoading(false); // یا استفاده از isSubmitting
    }
  };

  return (
    <AdminPageLayout
      pageTitle={isEditMode ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          {/* پیام‌های موفقیت و خطا */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-700/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-600">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCheck} className="ml-2 rtl:mr-2" />
                <span>{successMessage}</span>
              </div>
            </div>
          )}
          {formError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-700/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-600">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faTimes} className="ml-2 rtl:mr-2" />
                <span>{formError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Category Name */}
            <div className="mb-6">
              <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام دسته‌بندی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="category-name"
                {...register('name')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-amber-500 outline-none
                            bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
                            ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-amber-500'}`}
                placeholder="مثال: کیک‌های تولد"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
            </div>

            {/* Slug */}
            <div className="mb-6">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                اسلاگ <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="slug"
                  {...register('slug')}
                  className={`flex-1 px-4 py-2 border rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none focus:ring-2 focus:border-amber-500 outline-none
                              bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
                              ${errors.slug ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-amber-500'}`}
                  placeholder="مثال: birthday-cakes"
                />
                <button
                  type="button"
                  onClick={generateSlug}
                  title="تولید خودکار اسلاگ از نام"
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-600 border border-l-0 rtl:border-r-0 rtl:border-l border-gray-300 dark:border-slate-500 
                             rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500"
                >
                  <FontAwesomeIcon icon={faSyncAlt} />
                </button>
              </div>
              {errors.slug && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.slug.message}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">اسلاگ باید یکتا باشد و فقط شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد.</p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                توضیحات
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-amber-500 outline-none
                            bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
                            ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-amber-500'}`}
                placeholder="توضیحات مربوط به این دسته‌بندی..."
              ></textarea>
              {errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>}
            </div>

            {/* Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center w-auto
                                ${field.value
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-gray-200'
                      }`}
                  >
                    <FontAwesomeIcon icon={field.value ? faToggleOn : faToggleOff} className="ml-2 rtl:mr-2 text-lg" />
                    {field.value ? 'فعال' : 'غیرفعال'}
                  </button>
                )}
              />
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تصویر دسته‌بندی</label>
              <div className={`${imagePreview ? 'hidden' : 'block'}`}> {/* کلاس file-upload از CSS شما */}
                <label
                  htmlFor="category-image"
                  className="file-upload w-full h-32 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg 
                             flex flex-col items-center justify-center 
                             bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faCloudUploadAlt} className="text-gray-400 dark:text-slate-500 text-3xl mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">برای آپلود تصویر کلیک کنید یا فایل را اینجا بکشید</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">حداکثر ۲ مگابایت (JPG, PNG, WEBP)</p>
                  <input
                    type="file"
                    id="category-image"
                    accept="image/jpeg,image/png,image/webp"
                    {...register('image')} // react-hook-form فایل را مدیریت می‌کند
                    onChange={(e) => {
                      register('image').onChange(e); // برای اینکه react-hook-form مطلع شود
                      handleImageChange(e); // برای پیش‌نمایش
                    }}
                    className="hidden" // خود input مخفی است، label به عنوان trigger عمل می‌کند
                  />
                </label>
              </div>
              {errors.image && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image.message}</p>}

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-4">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <img src={imagePreview} alt="Preview" className="preview-image h-28 w-auto rounded-lg border border-gray-200 dark:border-slate-600 object-contain" /> {/* کلاس preview-image از CSS شما */}
                    <div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-3 py-1 bg-red-100 dark:bg-red-700/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-600/50 flex items-center"
                      >
                        <FontAwesomeIcon icon={faTrash} className="ml-1 rtl:mr-1" /> حذف تصویر
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse pt-4 border-t border-gray-200 dark:border-slate-700">
              <Link
                to="/admin/categories"
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-center"
              >
                <FontAwesomeIcon icon={faTimes} className="ml-1 rtl:mr-1" /> انصراف
              </Link>
              {/* <button // دکمه "ذخیره و ادامه" اگر لازم است
                type="submit" // یا type="button" و یک handler جدا
                // onClick={handleSubmit(data => onSubmit(data, true))} // مثال برای ارسال پارامتر اضافه
                disabled={isSubmitting || loading}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 flex items-center justify-center"
              >
                {isSubmitting || loading ? <FontAwesomeIcon icon={faSpinner} spin className="ml-2 rtl:mr-2" /> : <FontAwesomeIcon icon={faSave} className="ml-2 rtl:mr-2" />}
                ذخیره و ادامه ویرایش
              </button> */}
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center justify-center"
              >
                {isSubmitting || loading ? <FontAwesomeIcon icon={faSpinner} spin className="ml-2 rtl:mr-2" /> : <FontAwesomeIcon icon={faSave} className="ml-2 rtl:mr-2" />}
                {isEditMode ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminCategoryFormPage;