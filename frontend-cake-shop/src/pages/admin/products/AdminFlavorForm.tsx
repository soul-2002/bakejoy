// src/pages/admin/flavors/AdminFlavorFormPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faSave, faTimes, faCheck, faSpinner, faToggleOn, faToggleOff
} from '@fortawesome/free-solid-svg-icons';

import AdminPageLayout from '../../../components/admin/layout/AdminPageLayout';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createAdminFlavor,
  getAdminFlavorDetail,
  updateAdminFlavor
} from '../../../services/api'; // توابع API برای طعم‌ها
import { Flavor, FlavorFormData, UpdateFlavorFormData } from '../../../types'; // تایپ‌های مربوط به طعم

// اسکیمای اعتبارسنجی با Zod برای فرم طعم
const flavorFormSchema = z.object({
  name: z.string().min(2, "نام طعم حداقل باید ۲ کاراکتر باشد.").max(100, "نام طعم نباید بیشتر از ۱۰۰ کاراکتر باشد."),
  description: z.string().max(500, "توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد.").optional().nullable(),
  is_active: z.boolean().default(true),
});

type FlavorFormValues = z.infer<typeof flavorFormSchema>;

const AdminFlavorFormPage: React.FC = () => {
  const { flavorId } = useParams<{ flavorId?: string }>();
  const isEditMode = Boolean(flavorId);
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [pageLoading, setPageLoading] = useState(isEditMode); // لودینگ اولیه برای واکشی داده در حالت ویرایش
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FlavorFormValues>({
    resolver: zodResolver(flavorFormSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    }
  });

  const fetchFlavorForEdit = useCallback(async () => {
    if (isEditMode && flavorId && accessToken) {
      console.log(`Fetching flavor with ID: ${flavorId} for editing.`);
      setPageLoading(true);
      setFormError(null);
      try {
        const flavorData = await getAdminFlavorDetail(accessToken, flavorId); // <--- استفاده از تابع واکشی جزئیات طعم
        reset({ // پر کردن فرم با داده‌های موجود
          name: flavorData.name,
          description: flavorData.description || '',
          is_active: flavorData.is_active,
        });
        console.log("Flavor data loaded for edit:", flavorData);
      } catch (err: any) {
        console.error("Error fetching flavor details for edit:", err);
        setFormError("خطا در دریافت اطلاعات طعم: " + (err.message || ""));
      } finally {
        setPageLoading(false);
      }
    }
  }, [flavorId, isEditMode, accessToken, reset]);

  useEffect(() => {
    fetchFlavorForEdit();
  }, [fetchFlavorForEdit]);

  const onSubmit: SubmitHandler<FlavorFormValues> = async (formDataValues) => {
    if (!accessToken) {
      setFormError("توکن دسترسی موجود نیست. لطفاً دوباره وارد شوید.");
      return;
    }
    // setLoading(true); // isSubmitting از react-hook-form این کار را انجام می‌دهد
    setFormError(null);
    setSuccessMessage(null);

    const payload: FlavorFormData | UpdateFlavorFormData = {
      name: formDataValues.name,
      description: (formDataValues.description && formDataValues.description.trim() !== '') ? formDataValues.description : null,
      is_active: formDataValues.is_active,
    };

    console.log("Data to be sent to API (Flavor):", payload);

    try {
      let responseMessage = '';
      if (isEditMode && flavorId) {
        const updatedFlavor = await updateAdminFlavor(
          accessToken,
          flavorId,
          payload as Partial<FlavorFormData> // چون فقط فیلدهای تغییر یافته یا همه را می‌فرستیم
        );
        responseMessage = `طعم "${updatedFlavor.name}" با موفقیت ویرایش شد.`;
      } else {
        const newFlavor = await createAdminFlavor(
          accessToken,
          payload as FlavorFormData
        );
        responseMessage = `طعم "${newFlavor.name}" با موفقیت ایجاد شد.`;
        reset(); // ریست کردن فرم پس از ایجاد موفق
      }
      setSuccessMessage(responseMessage);
      setTimeout(() => {
        setSuccessMessage(null);
        navigate('/admin/flavors'); // بازگشت به لیست طعم‌ها
      }, 2000);
    } catch (err: any) {
      console.error("Error saving flavor:", err);
      let detailedError = "خطای ناشناخته در ذخیره‌سازی.";
      if (err && typeof err === 'object') {
        if (err.detail) {
          detailedError = err.detail;
        } else {
          const fieldErrors = Object.entries(err)
            .map(([key, value]) => `${key}: ${(Array.isArray(value) ? value.join(', ') : String(value))}`)
            .join('; ');
          if (fieldErrors) detailedError = fieldErrors;
        }
      } else if (typeof err === 'string') {
        detailedError = err;
      }
      setFormError(`خطا در ذخیره‌سازی طعم: ${detailedError}`);
    } 
    // finally { // setLoading(false) توسط isSubmitting هندل می‌شود
    // }
  };

  if (pageLoading && isEditMode) {
    return (
      <AdminPageLayout pageTitle="ویرایش طعم">
        <div className="flex justify-center items-center h-64">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-amber-500" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      pageTitle={isEditMode ? `ویرایش طعم: ${watch('name') || ''}` : "افزودن طعم جدید"}
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
            {/* Flavor Name */}
            <div className="mb-6">
              <label htmlFor="flavor-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام طعم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="flavor-name"
                {...register('name')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-amber-500 outline-none
                            bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
                            ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-amber-500'}`}
                placeholder="مثال: وانیلی، شکلاتی"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="flavor-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                توضیحات (اختیاری)
              </label>
              <textarea
                id="flavor-description"
                {...register('description')}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-amber-500 outline-none
                            bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
                            ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-amber-500'}`}
                placeholder="توضیحات بیشتر در مورد این طعم..."
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
            
            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse pt-4 border-t border-gray-200 dark:border-slate-700">
              <Link
                to="/admin/flavors" // بازگشت به لیست طعم‌ها
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-center"
              >
                <FontAwesomeIcon icon={faTimes} className="ml-1 rtl:mr-1" /> انصراف
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || pageLoading}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center justify-center"
              >
                {isSubmitting || pageLoading ? <FontAwesomeIcon icon={faSpinner} spin className="ml-2 rtl:mr-2" /> : <FontAwesomeIcon icon={faSave} className="ml-2 rtl:mr-2" />}
                {isEditMode ? 'ذخیره تغییرات' : 'ایجاد طعم'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminFlavorFormPage;