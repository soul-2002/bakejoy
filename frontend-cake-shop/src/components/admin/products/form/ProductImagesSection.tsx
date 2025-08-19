// src/components/admin/products/form/ProductImagesSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faTrash, faImage, faImages, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import type { ProductFormValues } from '../../../../pages/admin/products/AdminProductFormPage'; // مسیر به تایپ فرم اصلی

// تایپ برای هر آیتم پیش‌نمایش گالری (شامل فایل و URL پیش‌نمایش)
interface GalleryPreviewItem {
  file: File;
  previewUrl: string;
}

interface ProductImagesSectionProps {
  formMethods: UseFormReturn<ProductFormValues>;
  currentMainImageUrl?: string | null; // URL تصویر اصلی موجود (برای حالت ویرایش)
  currentGalleryImageUrls?: { id?: number, url: string }[]; // آرایه‌ای از URL های تصاویر گالری موجود
}

const MAX_MAIN_IMAGE_SIZE_MB = 2;
const MAX_GALLERY_IMAGE_SIZE_MB = 3;
const MAX_GALLERY_IMAGES = 5;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ProductImagesSection: React.FC<ProductImagesSectionProps> = ({
  formMethods,
  currentMainImageUrl,
  currentGalleryImageUrls = [],
}) => {
  const { register, control, setValue, watch, formState: { errors }, clearErrors } = formMethods;

  // State برای پیش‌نمایش تصویر اصلی
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(currentMainImageUrl || null);
  // State برای پیش‌نمایش تصاویر گالری (فایل‌های جدید)
  const [galleryPreviews, setGalleryPreviews] = useState<GalleryPreviewItem[]>([]);
  // State برای نگهداری URL تصاویر گالری موجود (در حالت ویرایش)
  const [existingGalleryImages, setExistingGalleryImages] = useState<{ id?: number, url: string }[]>(currentGalleryImageUrls);


  // Effect برای تنظیم پیش‌نمایش اولیه در حالت ویرایش
  useEffect(() => {
    if (currentMainImageUrl) {
      setMainImagePreview(currentMainImageUrl);
    }
    setExistingGalleryImages(currentGalleryImageUrls || []);
  }, [currentMainImageUrl, currentGalleryImageUrls]);


  // --- مدیریت تصویر اصلی ---
  const handleMainImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    clearErrors("main_image");
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > MAX_MAIN_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`حجم تصویر اصلی باید کمتر از ${MAX_MAIN_IMAGE_SIZE_MB} مگابایت باشد.`);
        event.target.value = ''; setValue('main_image', null); setMainImagePreview(currentMainImageUrl); return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        alert(`فرمت تصویر اصلی نامعتبر است. فرمت‌های مجاز: ${ACCEPTED_IMAGE_TYPES.join(', ')}.`);
        event.target.value = ''; setValue('main_image', null); setMainImagePreview(currentMainImageUrl); return;
      }

      setValue('main_image', files as any, { shouldValidate: true }); // FileList
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setValue('main_image', null, { shouldValidate: true });
      setMainImagePreview(currentMainImageUrl); // بازگشت به تصویر قبلی اگر انتخاب لغو شد
    }
  };

  const removeMainImage = () => {
    setValue('main_image', null, { shouldValidate: true });
    setMainImagePreview(null);
    // اگر می‌خواهید با remove، تصویر قبلی هم از سرور حذف شود، باید یک فیلد remove_main_image به فرم اضافه کنید
    // و در onSubmit آن را به API بفرستید. فعلاً فقط پیش‌نمایش و فایل انتخابی را پاک می‌کنیم.
    const fileInput = document.getElementById('main-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };


  // --- مدیریت گالری تصاویر ---
  const handleGalleryImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    clearErrors("gallery_images");
    if (files && files.length > 0) {
      const currentTotalImages = galleryPreviews.length + existingGalleryImages.length;
      if (currentTotalImages + files.length > MAX_GALLERY_IMAGES) {
        alert(`شما حداکثر می‌توانید ${MAX_GALLERY_IMAGES} تصویر برای گالری انتخاب کنید.`);
        event.target.value = '';
        return;
      }

      const newPreviews: GalleryPreviewItem[] = [...galleryPreviews];
      const newFilesForRHF: File[] = Array.from(watch('gallery_images') || []); // فایل‌های قبلی ثبت شده در RHF

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_GALLERY_IMAGE_SIZE_MB * 1024 * 1024) {
          alert(`حجم تصویر گالری (${file.name}) باید کمتر از ${MAX_GALLERY_IMAGE_SIZE_MB} مگابایت باشد.`);
          continue; // این فایل را نادیده بگیر
        }
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          alert(`فرمت تصویر گالری (${file.name}) نامعتبر است.`);
          continue; // این فایل را نادیده بگیر
        }

        newFilesForRHF.push(file); // اضافه کردن فایل به آرایه برای RHF

        // ایجاد پیش‌نمایش
        const reader = new FileReader();
        reader.onloadend = () => {
          // برای جلوگیری از آپدیت state داخل حلقه، می‌توانیم بعد از حلقه set کنیم
          setGalleryPreviews(prev => [...prev, { file, previewUrl: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      }
      // آپدیت react-hook-form با FileList جدید
      const dataTransfer = new DataTransfer();
      newFilesForRHF.forEach(file => dataTransfer.items.add(file));
      setValue('gallery_images', dataTransfer.files, { shouldValidate: true });
    }
    // پاک کردن مقدار اینپوت فایل تا کاربر بتواند دوباره همان فایل‌ها را انتخاب کند اگر لازم شد
    event.target.value = '';
  };

  const removeNewGalleryImage = (indexToRemove: number) => {
    const newFilePreviews = galleryPreviews.filter((_, index) => index !== indexToRemove);
    setGalleryPreviews(newFilePreviews);

    // آپدیت react-hook-form
    const currentFiles = Array.from(watch('gallery_images') || []);
    const updatedFiles = currentFiles.filter((_, index) => {
      // این منطق ممکن است دقیق نباشد اگر ترتیب فایل‌ها و پیش‌نمایش‌ها متفاوت باشد
      // بهتر است بر اساس نام فایل یا یک ID موقت حذف انجام شود اگر FileList را مستقیماً آپدیت می‌کنیم
      // ساده‌ترین راه: ساخت FileList جدید از newFilePreviews
      return newFilePreviews.some(p => p.file.name === (_ as File).name && p.file.lastModified === (_ as File).lastModified);
    });
    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));
    setValue('gallery_images', dataTransfer.files.length > 0 ? dataTransfer.files : null, { shouldValidate: true });
  };

  const removeExistingGalleryImage = (idToRemove?: number, urlToRemove?: string) => {
    setExistingGalleryImages(prev => prev.filter(img => img.id ? img.id !== idToRemove : img.url !== urlToRemove));
    // TODO: شما باید یک فیلد (مثلاً gallery_images_to_remove: number[]) به فرم اصلی اضافه کنید
    // و ID تصاویری که از گالری موجود حذف می‌شوند را در آن نگه دارید تا در onSubmit به API ارسال شود.
    // setValue('gallery_images_to_remove', [...(watch('gallery_images_to_remove') || []), idToRemove]);
    alert(`تصویر با ID/URL ${idToRemove || urlToRemove} برای حذف در بک‌اند علامت‌گذاری شد (پیاده‌سازی لازم است).`);
  };


  // کلاس‌های پایه برای input ها و پیام خطا (می‌تواند از یک فایل utils بیاید)
  const baseInputClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm";
  const defaultInputClasses = "border-gray-300 dark:border-slate-600 focus:ring-amber-500 focus:border-transparent";
  const errorInputClasses = "border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-transparent";
  const errorMessageClasses = "mt-1 text-sm text-red-600 dark:text-red-400";

  return (
    <div className="form-section bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="form-section-header p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">تصاویر محصول</h3>
      </div>
      <div className="form-section-body p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Image Upload & Preview */}
          <div>
            <label htmlFor="main-image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تصویر اصلی <span className="text-red-500">*</span>
            </label>
            {!mainImagePreview ? (
              <label
                htmlFor="main-image-upload"
                className="file-upload relative flex flex-col items-center justify-center p-6 rounded-lg cursor-pointer 
                           h-48 border-2 border-dashed border-gray-300 dark:border-slate-600 
                           bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600"
              >
                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-3xl text-gray-400 dark:text-slate-500 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">تصویر اصلی را آپلود کنید</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">فرمت‌های مجاز: JPG, PNG, WEBP, GIF</p>
                <input
                  type="file"
                  id="main-image-upload"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  // {...register('main_image')} // ثبت اولیه با RHF
                  // onChange={(e) => {
                  //     formMethods.register('main_image').onChange(e); // برای اینکه RHF آپدیت شود
                  //     handleMainImageChange(e); // تابع شما برای پیش‌نمایش و اعتبارسنجی بیشتر
                  // }}
                  onChange={(e) => {
                    handleMainImageChange(e); // اینجا داخلش خودت setValue بزنی
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" // یا از کلاس file-upload input CSS
                />
              </label>
            ) : (
              <div className="mt-2">
                <div className="relative w-full h-48 border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={mainImagePreview} alt="پیش‌نمایش تصویر اصلی" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="mt-2 text-right rtl:text-left">
                  <button
                    type="button"
                    onClick={removeMainImage}
                    className="px-3 py-1 bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-300 text-xs font-medium rounded-md hover:bg-red-200 dark:hover:bg-red-700/70 flex items-center"
                  >
                    <FontAwesomeIcon icon={faTrash} className="ml-1 rtl:mr-1" />
                    حذف تصویر
                  </button>
                </div>
              </div>
            )}
            {errors.main_image && <p className={errorMessageClasses}>{errors.main_image.message}</p>}
          </div>

          {/* Spacer or can be another field if needed */}
          <div>
            {/* این بخش می‌تواند خالی بماند یا برای توضیحات تصویر اصلی استفاده شود */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              تصویر اصلی محصول که در لیست محصولات و صفحه اصلی محصول نمایش داده می‌شود.
              حداکثر حجم: {MAX_MAIN_IMAGE_SIZE_MB} مگابایت.
            </p>
          </div>

          {/* Gallery Images Upload & Preview */}
          <div className="md:col-span-2">
            <label htmlFor="gallery-images-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              گالری تصاویر (اختیاری، حداکثر {MAX_GALLERY_IMAGES} تصویر)
            </label>
            <label
              htmlFor="gallery-images-upload"
              className="file-upload relative flex flex-col items-center justify-center p-6 rounded-lg cursor-pointer 
                         h-32 border-2 border-dashed border-gray-300 dark:border-slate-600 
                         bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 mb-4"
            >
              <FontAwesomeIcon icon={faImages} className="text-3xl text-gray-400 dark:text-slate-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">تصاویر گالری را انتخاب کنید</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">حداکثر {MAX_GALLERY_IMAGES} تصویر، هر کدام کمتر از {MAX_GALLERY_IMAGE_SIZE_MB} مگابایت.</p>
              <input
                type="file"
                id="gallery-images-upload"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                multiple // اجازه انتخاب چند فایل
                // {...register('gallery_images')} // ثبت اولیه
                onChange={(e) => {
                  // formMethods.register('gallery_images').onChange(e); // برای آپدیت RHF با FileList جدید
                  handleGalleryImageChange(e); // تابع شما برای پیش‌نمایش و اضافه کردن به state
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
            {errors.gallery_images && <p className={errorMessageClasses}>{errors.gallery_images.message}</p>}

            {/* Previews for existing and newly added gallery images */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Existing gallery images (در حالت ویرایش) */}
              {existingGalleryImages.map((img, index) => (
                <div key={img.id || `existing-${index}`} className="gallery-thumbnail h-24 sm:h-28 md:h-32 relative group">
                  <img src={img.url} alt={`تصویر گالری ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                  <div className="gallery-thumbnail-actions absolute top-1 left-1 rtl:right-1 rtl:left-auto opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 rtl:space-x-reverse">
                    <button type="button" onClick={() => removeExistingGalleryImage(img.id, img.url)}
                      className="p-1 bg-red-500/80 text-white rounded-full hover:bg-red-600 text-xs">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
              {/* New gallery image previews */}
              {galleryPreviews.map((item, index) => (
                <div key={`new-${index}-${item.file.name}`} className="gallery-thumbnail h-24 sm:h-28 md:h-32 relative group">
                  <img src={item.previewUrl} alt={`پیش‌نمایش گالری ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                  <div className="gallery-thumbnail-actions absolute top-1 left-1 rtl:right-1 rtl:left-auto opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 rtl:space-x-reverse">
                    <button type="button" onClick={() => removeNewGalleryImage(index)}
                      className="p-1 bg-red-500/80 text-white rounded-full hover:bg-red-600 text-xs">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
              {(existingGalleryImages.length === 0 && galleryPreviews.length === 0) && (
                <div className="col-span-full h-24 sm:h-28 md:h-32 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">
                  هنوز تصویری برای گالری انتخاب نشده است.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImagesSection;