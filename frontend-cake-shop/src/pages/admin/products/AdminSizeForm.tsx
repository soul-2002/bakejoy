// src/pages/admin/sizes/AdminSizeForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faSave, faTimes, faCheck, faSpinner, faToggleOn, faToggleOff,
  faWeightHanging, faMoneyBillWave, faCloudUploadAlt, // faCloudUploadAlt برای آپلود
} from '@fortawesome/free-solid-svg-icons';

import AdminPageLayout from '../../../components/admin/layout/AdminPageLayout';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createAdminSize,
  getAdminSizeDetail,
  updateAdminSize
} from '../../../services/api';
import { Size, SizeFormData, UpdateSizeFormData } from '../../../types';

// ایمپورت فایل CSS سفارشی اگر لازم است (مثلاً برای .file-upload)
// import '../../../styles/forms.css'; 

// اسکیمای اعتبارسنجی با Zod برای فرم اندازه
const sizeFormSchema = z.object({
  name: z.string().min(1, "نام اندازه الزامی است.").max(50, "نام اندازه نباید بیشتر از ۵۰ کاراکتر باشد."),
  description: z.string().max(500, "توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد.").optional().nullable(),
  estimated_weight_kg: z.string()
    .optional().nullable()
    .refine(val => !val || val.trim() === '' || !isNaN(parseFloat(val.replace(/,/g, '.'))), { message: "وزن تخمینی باید عدد معتبر باشد (مثال: 1.5 یا 0.75)." })
    .transform(val => (val && val.trim() !== '') ? parseFloat(val.replace(/,/g, '.')) : null),
  price_modifier: z.string()
    .optional().nullable()
    .refine(val => !val || val.trim() === '' || !isNaN(parseFloat(val.replace(/,/g, '.'))), { message: "تعدیل‌کننده قیمت باید عدد معتبر باشد (مثال: 50000 یا -10000)." })
    .transform(val => (val && val.trim() !== '') ? parseFloat(val.replace(/,/g, '.')) : 0.00), // پیش‌فرض 0 اگر خالی است
  is_active: z.boolean().default(true),
});

type SizeFormValues = z.infer<typeof sizeFormSchema>;

const AdminSizeForm: React.FC = () => {
  const { sizeId } = useParams<{ sizeId?: string }>();
  const isEditMode = Boolean(sizeId);
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<SizeFormValues>({
    resolver: zodResolver(sizeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      estimated_weight_kg: '',
      price_modifier: '0', // مقدار پیش‌فرض به صورت رشته برای input
      is_active: true,
    }
  });

  const fetchSizeForEdit = useCallback(async () => {
    if (isEditMode && sizeId && accessToken) {
      setPageLoading(true);
      setFormError(null);
      try {
        const sizeData = await getAdminSizeDetail(accessToken, sizeId);
        reset({
          name: sizeData.name,
          description: sizeData.description || '',
          estimated_weight_kg: sizeData.estimated_weight_kg ? String(sizeData.estimated_weight_kg) : '',
          price_modifier: sizeData.price_modifier ? String(sizeData.price_modifier) : '0',
          is_active: sizeData.is_active,
        });
      } catch (err: any) {
        setFormError("خطا در دریافت اطلاعات اندازه: " + (err.message || ""));
      } finally {
        setPageLoading(false);
      }
    }
  }, [sizeId, isEditMode, accessToken, reset]);

  useEffect(() => {
    fetchSizeForEdit();
  }, [fetchSizeForEdit]);

  const onSubmit: SubmitHandler<SizeFormValues> = async (formDataValues) => {
    if (!accessToken) {
      setFormError("توکن دسترسی موجود نیست.");
      return;
    }
    setFormError(null);
    setSuccessMessage(null);

    // مقادیر از formDataValues حالا باید توسط Zod transform تبدیل شده باشند
    const payload: SizeFormData | Partial<SizeFormData> = {
      name: formDataValues.name,
      description: formDataValues.description,
      estimated_weight_kg: formDataValues.estimated_weight_kg,
      price_modifier: formDataValues.price_modifier,
      is_active: formDataValues.is_active,
    };

    console.log("Data to be sent to API (Size):", payload);

    try {
      let responseMessage = '';
      if (isEditMode && sizeId) {
        const updatedSize = await updateAdminSize(accessToken, sizeId, payload as Partial<SizeFormData>);
        responseMessage = `اندازه "${updatedSize.name}" با موفقیت ویرایش شد.`;
      } else {
        const newSize = await createAdminSize(accessToken, payload as SizeFormData);
        responseMessage = `اندازه "${newSize.name}" با موفقیت ایجاد شد.`;
        reset();
      }
      setSuccessMessage(responseMessage);
      setTimeout(() => {
        setSuccessMessage(null);
        navigate('/admin/sizes');
      }, 2000);
    } catch (err: any) {
      console.error("Error saving size:", err);
      let detailedError = "خطای ناشناخته در ذخیره‌سازی.";
      if (err && typeof err === 'object') {
        if (err.detail) { detailedError = err.detail; }
        else {
          const fieldErrors = Object.entries(err).map(([key, value]) => `${key}: ${(Array.isArray(value) ? value.join(', ') : String(value))}`).join('; ');
          if (fieldErrors) detailedError = fieldErrors;
        }
      } else if (typeof err === 'string') { detailedError = err; }
      setFormError(`خطا در ذخیره‌سازی اندازه: ${detailedError}`);
    }
  };

  // کلاس‌های پایه برای input ها و پیام خطا برای جلوگیری از تکرار
  const baseInputClasses = "w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200";
  const errorInputClasses = "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500";
  const defaultInputClasses = "border-gray-300 dark:border-slate-600 focus:ring-amber-500 focus:border-amber-500";
  const errorMessageClasses = "mt-1 text-sm text-red-600 dark:text-red-400";

  if (pageLoading && isEditMode) {
    return (
      <AdminPageLayout pageTitle="ویرایش اندازه">
        <div className="flex justify-center items-center h-64">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-amber-500" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      pageTitle={isEditMode ? `ویرایش اندازه: ${watch('name') || ''}` : "افزودن اندازه جدید"}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-700/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-600 flex items-center">
              <FontAwesomeIcon icon={faCheck} className="ml-2 rtl:mr-2" />
              <span>{successMessage}</span>
            </div>
          )}
          {formError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-700/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-600 flex items-center">
              <FontAwesomeIcon icon={faTimes} className="ml-2 rtl:mr-2" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Name */}
            <div className="mb-6">
              <label htmlFor="size-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام اندازه <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="size-name"
                {...register('name')}
                className={`${baseInputClasses} ${errors.name ? errorInputClasses : defaultInputClasses}`}
                placeholder="مثال: کوچک، ۸ اینچ، ۱ کیلویی"
              />
              {errors.name && <p className={errorMessageClasses}>{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="size-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                توضیحات (اختیاری)
              </label>
              <textarea
                id="size-description"
                {...register('description')}
                rows={3}
                className={`${baseInputClasses} ${errors.description ? errorInputClasses : defaultInputClasses}`}
                placeholder="توضیحات بیشتر در مورد این اندازه..."
              ></textarea>
              {errors.description && <p className={errorMessageClasses}>{errors.description.message}</p>}
            </div>
            
            {/* Estimated Weight & Price Modifier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-6">
              <div>
                <label htmlFor="estimated-weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  وزن تخمینی (کیلوگرم)
                </label>
                 <div className="relative">
                    <input
                        type="text"
                        id="estimated-weight"
                        {...register('estimated_weight_kg')}
                        className={`${baseInputClasses} pr-10 rtl:pl-10 rtl:pr-3 ${errors.estimated_weight_kg ? errorInputClasses : defaultInputClasses}`}
                        placeholder="مثال: 1.5 یا 0.75"
                    />
                    <span className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto pr-3 rtl:pl-3 flex items-center text-gray-500 dark:text-gray-400 pointer-events-none">
                        <FontAwesomeIcon icon={faWeightHanging} />
                    </span>
                </div>
                {errors.estimated_weight_kg && <p className={errorMessageClasses}>{errors.estimated_weight_kg.message}</p>}
              </div>

              <div>
                <label htmlFor="price-modifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  تعدیل‌کننده قیمت (تومان)
                </label>
                <div className="relative">
                    <input
                        type="text"
                        id="price-modifier"
                        {...register('price_modifier')}
                        className={`${baseInputClasses} pr-10 rtl:pl-10 rtl:pr-3 ${errors.price_modifier ? errorInputClasses : defaultInputClasses}`}
                        placeholder="مثال: 50000 یا -10000"
                    />
                     <span className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto pr-3 rtl:pl-3 flex items-center text-gray-500 dark:text-gray-400 pointer-events-none">
                        <FontAwesomeIcon icon={faMoneyBillWave} />
                    </span>
                </div>
                {errors.price_modifier && <p className={errorMessageClasses}>{errors.price_modifier.message}</p>}
              </div>
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
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center w-auto transition-colors
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
            
            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse pt-4 border-t border-gray-200 dark:border-slate-700">
              <Link
                to="/admin/sizes"
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-center transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="ml-1 rtl:mr-1" /> انصراف
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || pageLoading}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center justify-center transition-colors disabled:opacity-70"
              >
                {isSubmitting || pageLoading ? <FontAwesomeIcon icon={faSpinner} spin className="ml-2 rtl:mr-2" /> : <FontAwesomeIcon icon={faSave} className="ml-2 rtl:mr-2" />}
                {isEditMode ? 'ذخیره تغییرات' : 'ایجاد اندازه'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminSizeForm;