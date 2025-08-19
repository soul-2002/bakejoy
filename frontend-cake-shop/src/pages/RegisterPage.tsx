import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import { registerUser } from '../services/api';
import { RegisterFormData } from '../schemas/registerSchema';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faCheckCircle, faExclamationCircle, faArrowRight } from '@fortawesome/free-solid-svg-icons';

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await registerUser(data);
      setSuccess("ثبت نام شما با موفقیت انجام شد! برای فعال‌سازی حساب، لطفاً ایمیل خود را بررسی کنید.");
      // setTimeout(() => navigate('/login'), 5000); // هدایت خودکار پس از ۵ ثانیه
    } catch (err: any) {
      setError(err.message || "خطایی در ثبت نام رخ داده است.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center py-8 px-4 pattern-bg">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-amber-50 py-4 px-6 border-b border-amber-100">
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              <FontAwesomeIcon icon={faUserPlus} className="ml-2 text-amber-500" />
              به خانواده BAKEJÖY بپیوندید!
            </h1>
          </div>
          
          <div className="p-6">
            {success && (
              <div className="success-message bg-green-50 text-green-600 p-3 rounded-lg mb-4 flex items-start">
                <FontAwesomeIcon icon={faCheckCircle} className="ml-2 mt-0.5" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="error-message bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-start">
                <FontAwesomeIcon icon={faExclamationCircle} className="ml-2 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {!success && <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />}
          </div>
          
          <div className="bg-gray-50 py-4 px-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              قبلاً حساب کاربری ساخته‌اید؟
              <Link to="/login" className="text-amber-600 hover:underline font-medium mr-1">وارد شوید</Link>
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

export default RegisterPage;