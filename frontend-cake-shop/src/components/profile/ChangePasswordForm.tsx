import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordFormSchema, type PasswordFormData } from '../../schemas/userProfileSchemas';

interface ChangePasswordFormProps {
    onSubmit: (data: PasswordFormData) => Promise<void>;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSubmit }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordFormSchema)
    });

    const processSubmit = async (data: PasswordFormData) => {
        await onSubmit(data);
        reset(); // پاک کردن فرم پس از موفقیت
    };
    
    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">تغییر رمز عبور</h2>
            <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="currentPassword">رمز عبور فعلی*</label>
                    <input type="password" {...register('current_password')} id="currentPassword" className="form-input w-full p-2 border border-gray-300 rounded-lg" />
                    {errors.current_password && <p className="text-red-500 text-sm mt-1">{errors.current_password.message}</p>}
                </div>
                <div>
                    <label htmlFor="newPassword">رمز عبور جدید*</label>
                    <input type="password" {...register('new_password')} id="newPassword" className="form-input w-full p-2 border border-gray-300 rounded-lg" />
                    {errors.new_password && <p className="text-red-500 text-sm mt-1">{errors.new_password.message}</p>}
                </div>
                <div>
                    <label htmlFor="confirmPassword">تکرار رمز عبور جدید*</label>
                    <input type="password" {...register('confirm_password')} id="confirmPassword" className="form-input w-full p-2 border border-gray-300 rounded-lg" />
                    {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password.message}</p>}
                </div>
                <div className="pt-4">
                    <button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50">
                        {isSubmitting ? 'در حال تغییر...' : 'تغییر رمز عبور'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePasswordForm;