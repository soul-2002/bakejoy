import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../../schemas/loginSchema';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });
  
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">ایمیل یا نام کاربری</label>
        <div className="relative">
          <input type="text" id="username" {...register('username')} className="w-full input-field py-2 px-4 rounded-lg" />
          <div className="absolute left-3 top-2.5 text-gray-400"><FontAwesomeIcon icon={faUser} /></div>
        </div>
        {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} id="password" {...register('password')} className="w-full input-field py-2 px-4 rounded-lg pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle absolute left-3 top-2.5 text-gray-400">
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input id="remember-me" type="checkbox" className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"/>
          <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-700">مرا به خاطر بسپار</label>
        </div>
        <a href="#" className="text-sm text-amber-600 hover:underline">رمز عبور را فراموش کرده‌اید؟</a>
      </div>

      <button type="submit" disabled={isLoading} className="w-full login-btn py-2.5 px-4 rounded-lg text-white font-medium flex items-center justify-center">
        {isLoading && <FontAwesomeIcon icon={faSpinner} className="loading-spinner ml-2" />}
        <span>{isLoading ? 'در حال ورود...' : 'ورود به حساب'}</span>
      </button>
    </form>
  );
};

export default LoginForm;