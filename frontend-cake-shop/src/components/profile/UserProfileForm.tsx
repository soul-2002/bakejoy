import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileFormSchema, type ProfileFormData } from '../../schemas/userProfileSchemas';
import type { User } from '../../types'; // تایپ کاربر شما

interface UserProfileFormProps {
  user: User; // اطلاعات اولیه کاربر
  onSubmit: (data: ProfileFormData) => Promise<void>; // تابعی برای ارسال به API
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ user, onSubmit }) => {
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      // ... سایر فیلدها
    }
  });

  // اگر کاربر از بیرون تغییر کرد، فرم را ریست کن
  useEffect(() => {
    reset(user);
  }, [user, reset]);

  const handleCancel = () => {
    reset(); // برگرداندن به مقادیر اولیه
    setIsEditing(false);
  };

  const processSubmit = async (data: ProfileFormData) => {
    await onSubmit(data);
    setIsEditing(false); // پس از موفقیت، به حالت مشاهده برگرد
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">اطلاعات شخصی</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-amber-600 hover:text-amber-700 font-medium">
            ویرایش اطلاعات
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
        {/* First Name & Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-gray-700 font-medium mb-1">نام*</label>
            <input {...register('first_name')} id="firstName" disabled={!isEditing} className="form-input w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100" />
            {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-gray-700 font-medium mb-1">نام خانوادگی*</label>
            <input {...register('last_name')} id="lastName" disabled={!isEditing} className="form-input w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100" />
            {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
          </div>
        </div>
        
        {/* Email (Read-only) */}
        <div>
          <label htmlFor="email" className="block text-gray-700 font-medium mb-1">آدرس ایمیل</label>
          <input id="email" value={user.email || ''} readOnly disabled className="form-input w-full p-2 border border-gray-300 rounded-lg bg-gray-100" />
        </div>
        
        {/* Phone Number */}
        <div>
           <label htmlFor="phone" className="block text-gray-700 font-medium mb-1">شماره تلفن</label>
           <input {...register('phone')} id="phone" disabled={!isEditing} className="form-input w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100" />
        </div>

        {isEditing && (
          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50">
              {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
            <button type="button" onClick={handleCancel} className="mr-4 text-gray-600 hover:text-gray-800 font-medium">
              انصراف
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default UserProfileForm;