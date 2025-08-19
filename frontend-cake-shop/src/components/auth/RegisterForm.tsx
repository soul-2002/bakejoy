import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '../../schemas/registerSchema';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import PasswordStrengthMeter from './PasswordStrengthMeter';

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  isLoading: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordValue = watch('password');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* First & Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">نام</label>
          <div className="relative"><input {...register('first_name')} id="first-name" className="w-full input-field py-2 px-4 rounded-lg" /><div className="absolute left-3 top-2.5 text-gray-400"><FontAwesomeIcon icon={faUser} /></div></div>
          {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
        </div>
        <div>
          <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">نام خانوادگی</label>
          <div className="relative"><input {...register('last_name')} id="last-name" className="w-full input-field py-2 px-4 rounded-lg" /><div className="absolute left-3 top-2.5 text-gray-400"><FontAwesomeIcon icon={faUser} /></div></div>
          {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
        </div>
      </div>
      
      {/* Username & Email */}
      <div><label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">نام کاربری</label><div className="relative"><input {...register('username')} id="username" className="w-full input-field py-2 px-4 rounded-lg" /><div className="absolute left-3 top-2.5 text-gray-400"><FontAwesomeIcon icon={faUser} /></div></div>{errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}</div>
      <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">آدرس ایمیل</label><div className="relative"><input type="email" {...register('email')} id="email" className="w-full input-field py-2 px-4 rounded-lg" /><div className="absolute left-3 top-2.5 text-gray-400"><FontAwesomeIcon icon={faEnvelope} /></div></div>{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}</div>
      <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">شماره تلفن (اختیاری)</label><div className="relative"><input type="tel" {...register('phone')} id="phone" className="w-full input-field py-2 px-4 rounded-lg" /><div className="absolute left-3 top-2.5 text-gray-400"><FontAwesomeIcon icon={faPhone} /></div></div>{errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}</div>

      {/* Password */}
      <div>
        <label htmlFor="password">رمز عبور</label>
        <div className="relative"><input type={showPassword ? 'text' : 'password'} {...register('password')} id="password" className="w-full input-field py-2 px-4 rounded-lg pr-10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle absolute left-3 top-2.5 text-gray-400"><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button></div>
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        <PasswordStrengthMeter password={passwordValue} />
      </div>
      
      {/* Confirm Password */}
      <div>
        <label htmlFor="password2">تکرار رمز عبور</label>
        <div className="relative"><input type={showConfirmPassword ? 'text' : 'password'} {...register('password2')} id="password2" className="w-full input-field py-2 px-4 rounded-lg pr-10" /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle absolute left-3 top-2.5 text-gray-400"><FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} /></button></div>
        {errors.password2 && <p className="text-xs text-red-500 mt-1">{errors.password2.message}</p>}
      </div>

      {/* Terms */}
      <div className="flex items-start"><div className="flex items-center h-5"><input id="terms" type="checkbox" {...register('terms')} className="custom-checkbox" /></div><div className="mr-3 text-sm"><label htmlFor="terms" className="font-medium text-gray-700">با <a href="/terms" className="text-amber-600 hover:underline">شرایط و مقررات</a> موافقم</label></div></div>
      {errors.terms && <p className="text-xs text-red-500 mt-1">{errors.terms.message}</p>}

      <button type="submit" disabled={isLoading} className="w-full register-btn py-2.5 px-4 rounded-lg text-white font-medium focus:outline-none flex items-center justify-center">
        {isLoading && <FontAwesomeIcon icon={faSpinner} className="loading-spinner ml-2" />}
        <span>{isLoading ? 'در حال ثبت نام...' : 'ثبت نام'}</span>
      </button>
    </form>
  );
};

export default RegisterForm;