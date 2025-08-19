import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import { login as apiLogin } from '../services/api'; // تابع API شما
import { LoginFormData } from '../schemas/loginSchema';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faExclamationCircle, faArrowRight } from '@fortawesome/free-solid-svg-icons';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ۱. هوک‌ها و توابع لازم از کد شما
  const { login: contextLogin } = useAuth(); // نام تابع را به contextLogin تغییر دادیم تا با apiLogin تداخل نداشته باشد
  const navigate = useNavigate();
  const location = useLocation();

  // ۲. منطق پیدا کردن مسیر بازگشت (Redirect)
  const from = location.state?.from?.pathname || '/profile'; // مسیر پیش‌فرض: پروفایل

  // ۳. تابع handleLogin با منطق کامل شما
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // فراخوانی API برای گرفتن توکن‌ها
      const tokens = await apiLogin({ username: data.username, password: data.password });
      // ذخیره توکن‌ها در context
      await contextLogin(tokens);
      // هدایت کاربر به صفحه قبلی یا پروفایل
      navigate(from, { replace: true });
    } catch (err: any) { 
      setError(err.message || "نام کاربری یا رمز عبور اشتباه است.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="pattern-bg min-h-screen flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-amber-50 py-4 px-6 border-b border-amber-100">
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              <FontAwesomeIcon icon={faSignInAlt} className="ml-2 text-amber-500" />
              ورود به حساب کاربری
            </h1>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="error-message bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-start">
                <FontAwesomeIcon icon={faExclamationCircle} className="ml-2 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
            
            <div className="my-6">
              <div className="divider text-sm">یا ورود با</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="social-btn py-2 px-4 rounded-lg flex items-center justify-center">
                <span>گوگل</span>
              </button>
              <button className="social-btn py-2 px-4 rounded-lg flex items-center justify-center">
                <span>فیسبوک</span>
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 py-4 px-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              حساب کاربری ندارید؟
              <Link to="/register" className="text-amber-600 hover:underline font-medium mr-1">ثبت نام کنید</Link>
            </p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-amber-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </main>
  );
};
export default LoginPage;